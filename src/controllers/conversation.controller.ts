import { IUser } from "@/contracts/user.contract";
import { CreateConversationPayload, UpdateConversationPayload } from "@/contracts/conversation.contract";
import { ICombinedRequest, IContextRequest, IParamsRequest, IUserRequest } from "@/contracts/request.contract";
import { conversationService, messageService, userService } from "@/services";
import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { ObjectId, Types } from "mongoose";
import { socketManager } from "@/datasources/socket.datasource";

export const conversationController = {
  getConversations: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const conversations = await conversationService.getConversations(user.id);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: conversations,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  createConversation: async (
    {
      body: { isGroup, members, description, image, title },
      context: { user },
    }: ICombinedRequest<IUserRequest, CreateConversationPayload>,
    res: Response
  ) => {
    try {
      // If there are no members in the group, return a bad request
      if (!members.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
        });
      }

      // If members length is greater than 10, return a bad request
      // This is only for non-subscribed users
      // TODO: Check if the user is subscribed and then check the limit
      if (members.length > 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          error: "You can only create a group with at max 10 members",
        });
      }

      // Check if the conversation already exists
      const alreadyExists = await conversationService.checkConversationExists(
        user.id,
        members.map((member) => member.toString())
      );

      // If the conversation already exists and it is not a group, return a conflict
      if (alreadyExists && isGroup === false) {
        // const io = socketManager.getIo();

        // if (io) {
        //   console.log("IO Exists");
        //   const createdConversation = await conversationService.getConversation(user.id, alreadyExists.id);

        //   const allMembers = createdConversation!.members;

        //   allMembers.forEach((member) => {
        //     const socketId = socketManager.getSocketId(member.id.toString());
        //     if (socketId) {
        //       io.to(socketId).emit("create-conversation", createdConversation);
        //     }
        //   });
        // } else {
        //   console.log("IO does not exist");
        // }

        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message: ReasonPhrases.CONFLICT,
          data: alreadyExists,
        });
      }

      const allMembers = [...new Set([...members.map((member) => member.toString()), user.id.toString()])] as string[];

      // Check if any of the members have exceeded the conversation limit
      const exceedingLimitMembers = await userService.checkIfAnyConversationLimitExceeded(allMembers, "CHATS");
      if (exceedingLimitMembers.length) {
        console.log("Exceeding Limit Members", exceedingLimitMembers);
        const exceedingMembersObjects = exceedingLimitMembers.map((member) => {
          console.log("Member", member.id.toString());
          console.log("You", user.id.toString());
          return {
            name: member.id.toString() === user.id.toString() ? "You" : member.name,
            mobileNumber: member.mobileNumber,
          };
        });

        return res.status(StatusCodes.PAYMENT_REQUIRED).json({
          status: StatusCodes.PAYMENT_REQUIRED,
          message: ReasonPhrases.PAYMENT_REQUIRED,
          error: `User(s) ${exceedingLimitMembers.join(", ")} has exceeded the conversation limit`,
          members: exceedingMembersObjects,
        });
      }

      const conversation = await conversationService.create({
        isGroup,
        members,
        description,
        image,
        title,
        userId: user.id,
      });

      console.log("All Members", allMembers);
      await userService.decrementChatCount(allMembers);

      const io = socketManager.getIo();

      if (io) {
        const createdConversation = await conversationService.getConversation(user.id, conversation._id.toString());

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member);
          if (socketId) {
            io.to(socketId).emit("create-conversation", createdConversation);
            io.to(socketId).emit("message", {
              senderId: user.id,
              sender: {
                _id: user.id,
                name: user.name,
                id: user.id,
              },
              message: `${user.name} created a new conversation`,
              conversationId: conversation._id,
              isQrCode: false,
              isNotification: true,
            });
          }
        });
      }

      // Save message to the database
      await messageService.create({
        content: `${user.name} created a new conversation`,
        conversation: new Types.ObjectId(conversation._id),
        sender: user.id,
        isNotification: true,
        isQrCode: false,
        scannedBy: [],
      });

      return res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        message: ReasonPhrases.CREATED,
        data: conversation,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  getConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: conversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  updateConversation: async (
    {
      body,
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, UpdateConversationPayload, { conversationId: string }>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (body.members) {
        body.isGroup = body.members.length > 2 ? true : body.isGroup;
      }

      const existingMembersIds = conversation.members.map((member) => member.id.toString());
      const newMembersIds = body.members ? body.members.map((member) => member.toString()) : [];
      if (body.members) {
        const addedMembers = newMembersIds.filter((member) => !existingMembersIds.includes(member));
        const removedMembers = existingMembersIds.filter((member) => !newMembersIds.includes(member));

        const exceedingLimitMembers = await userService.checkIfAnyConversationLimitExceeded(addedMembers, "CHATS");
        if (exceedingLimitMembers.length) {
          console.log("Exceeding Limit Members", exceedingLimitMembers);
          const exceedingMembersObjects = exceedingLimitMembers.map((member) => {
            console.log("Member", member.id.toString());
            console.log("You", user.id.toString());
            return {
              name: member.id.toString() === user.id.toString() ? "You" : member.name,
              mobileNumber: member.mobileNumber,
            };
          });
          return res.status(StatusCodes.PAYMENT_REQUIRED).json({
            status: StatusCodes.PAYMENT_REQUIRED,
            message: ReasonPhrases.PAYMENT_REQUIRED,
            error: `User(s) ${exceedingLimitMembers.join(", ")} has exceeded the conversation limit`,
            members: exceedingMembersObjects,
          });
        }

        const addedMembersObjects = await userService.getUsersByIds(addedMembers);
        const removedMembersObjects = await userService.getUsersByIds(removedMembers);

        const io = socketManager.getIo();
        if (io) {
          removedMembers.forEach((member) => {
            const socketId = socketManager.getSocketId(member);
            if (socketId) {
              io.to(socketId).emit("conversation-deleted", conversationId);
            }
          });

          addedMembers.forEach((member) => {
            const socketId = socketManager.getSocketId(member);
            if (socketId) {
              io.to(socketId).emit("create-conversation", conversation);
            }
          });

          // get added members and the users that are in the conversation
          const remainingMembers = conversation.members.filter(
            (member) => !removedMembers.includes(member.id.toString())
          );

          const remainingMembersIds = remainingMembers.map((member) => member.id.toString());

          const allActiveMembers = [...new Set([...addedMembers, ...remainingMembersIds])];

          // TODO: Look into this for notification of people added and people removed

          allActiveMembers.forEach((member) => {
            const socketId = socketManager.getSocketId(member);
            if (socketId) {
              addedMembersObjects.forEach((addedMember) => {
                io.to(socketId).emit("message", {
                  senderId: user.id,
                  sender: {
                    _id: user.id,
                    name: user.name,
                    id: user.id,
                  },
                  message: `${user.name} added ${addedMember.name}`,
                  conversationId,
                  isQrCode: false,
                  isNotification: true,
                });
              });

              removedMembersObjects.forEach((removedMember) => {
                io.to(socketId).emit("message", {
                  senderId: user.id,
                  sender: {
                    _id: user.id,
                    name: user.name,
                    id: user.id,
                  },
                  message: `${user.name} removed ${removedMember.name}`,
                  conversationId,
                  isQrCode: false,
                  isNotification: true,
                });
              });
            }
          });
        }

        // Check if any of the removed member is an admin
        const conversationAdmins = conversation.admin.map((admin) => admin.toString());
        const removedAdmins = conversationAdmins.filter((admin) => removedMembers.includes(admin.toString()));
        if (removedAdmins.length) {
          const newAdmin = existingMembersIds.filter((member) => !removedMembers.includes(member))[0];
          Object.assign(body, { admin: [new Types.ObjectId(newAdmin)] });
        }

        const messagePromises: Promise<any>[] = [];
        removedMembersObjects.forEach((member) => {
          messagePromises.push(
            messageService.create({
              content: `${user.name} removed ${member!.name}`,
              conversation: new Types.ObjectId(conversationId),
              sender: user.id,
              isNotification: true,
              isQrCode: false,
              scannedBy: [],
            })
          );
        });

        addedMembersObjects.forEach((member) => {
          messagePromises.push(
            messageService.create({
              content: `${user.name} added ${member!.name}`,
              conversation: new Types.ObjectId(conversationId),
              sender: user.id,
              isNotification: true,
              isQrCode: false,
              scannedBy: [],
            })
          );
        });

        await Promise.all([
          userService.incrementChatCount(removedMembers),
          userService.decrementChatCount(addedMembers),
          messagePromises,

          // messageService.create({
          //   content: `${user.name} added ${addedMembers.length} new member(s)`,
          //   conversation: new Types.ObjectId(conversationId),
          //   sender: user.id,
          //   isNotification: true,
          //   isQrCode: false,
          //   scannedBy: [],
          // }),
        ]);
      }

      const updatedConversation = await conversationService.updateConversation(user.id, conversationId, body);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  readConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const updatedConversation = await conversationService.readConversation(user.id, conversationId);

      const io = socketManager.getIo();

      if (io) {
        const allMembers = [...new Set([...conversation.members, user.id])];

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member);
          if (socketId) {
            io.to(socketId).emit("read-conversation", conversation._id);
          }
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  deleteConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const deletedConversation = await conversationService.deleteConversation(user.id, conversationId);
      await userService.incrementChatCount(conversation.members.map((member) => member.id.toString()));

      return res.status(StatusCodes.NO_CONTENT).json({
        status: StatusCodes.NO_CONTENT,
        message: ReasonPhrases.NO_CONTENT,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getMessages: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);
      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const messages = await messageService.getAll({
        conversation: new Types.ObjectId(conversationId),
        lastMessageDate: conversation.lastMessageTime,
      });

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: messages,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
  blockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          reason: "IS_GROUP_CONVERSATION",
        });
      }

      const blockedConversation = await conversationService.blockConversation(user.id, conversationId);

      const io = socketManager.getIo();
      if (io) {
        const allMembers = conversation.members;

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member.id.toString());
          if (socketId) {
            io.to(socketId).emit("block-conversation", {
              conversationId: conversation._id,
              blockedBy: user.id,
            });
            io.to(socketId).emit("message", {
              senderId: user.id,
              sender: {
                _id: user.id,
                name: user.name,
                id: user.id,
              },
              message: `${user.name} blocked the conversation`,
              conversationId: conversation._id,
              isQrCode: false,
              isNotification: true,
            });
          }
        });
      } else {
        console.log("IO does not exist");
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: blockedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  unblockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          reason: "IS_GROUP_CONVERSATION",
        });
      }

      const unblockedConversation = await conversationService.unblockConversation(user.id, conversationId);

      const io = socketManager.getIo();
      if (io) {
        const allMembers = conversation.members;

        allMembers.forEach((member) => {
          const socketId = socketManager.getSocketId(member.id.toString());
          if (socketId) {
            io.to(socketId).emit("unblock-conversation", {
              conversationId: conversation._id,
              unblockedBy: user.id,
            });
            io.to(socketId).emit("message", {
              senderId: user.id,
              sender: {
                _id: user.id,
                name: user.name,
                id: user.id,
              },
              message: `${user.name} unblocked the conversation`,
              conversationId: conversation._id,
              isQrCode: false,
              isNotification: true,
            });
          }
        });
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: unblockedConversation,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  unlockConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      const unscannedMessages = await messageService.findUnscannedMessages({
        conversation: new Types.ObjectId(conversationId),
        scannedBy: user.id,
      });

      if (!unscannedMessages.length) {
        return res.status(StatusCodes.OK).json({
          status: StatusCodes.OK,
          message: ReasonPhrases.OK,
          data: conversation,
        });
      }

      const unscannedMessage = unscannedMessages[0];

      await messageService.addScannedBy({
        id: unscannedMessage.id,
        conversation: new Types.ObjectId(conversationId),
        scannedBy: new Types.ObjectId(user.id),
      });

      const lastMashupMessage = await messageService.findLastMashupMessage({
        conversation: new Types.ObjectId(conversationId),
      });

      const scannedByUsers = lastMashupMessage?.scannedBy
        ? Array.isArray(lastMashupMessage.scannedBy)
          ? lastMashupMessage.scannedBy
          : [lastMashupMessage.scannedBy]
        : [];

      const thisUserExists = scannedByUsers.includes(new Types.ObjectId(user.id));

      if (lastMashupMessage && thisUserExists) {
        const io = socketManager.getIo();
        if (io) {
          const receiverId = socketManager.getSocketId(user.id);
          if (receiverId) {
            io.to(receiverId).emit("unlock-conversation", conversation._id);
          }

          scannedByUsers.forEach((scannedByUser) => {
            const socketId = socketManager.getSocketId(scannedByUser.toString());
            if (socketId) {
              io.to(socketId).emit("message", {
                senderId: user.id,
                sender: {
                  _id: user.id,
                  name: user.name,
                  id: user.id,
                },
                message: `${user.name} unlocked the conversation`,
                conversationId: conversation._id,
                isQrCode: false,
                isNotification: true,
              });
            }
          });
        }
      }

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  getBlockedUsers: async ({ context: { user } }: IContextRequest<IUserRequest>, res: Response) => {
    try {
      const blockedUsers = await conversationService.getBlockedUsers(user.id);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: blockedUsers,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },

  leaveConversation: async (
    {
      context: { user },
      params: { conversationId },
    }: ICombinedRequest<IUserRequest, IParamsRequest<{ conversationId: string }>>,
    res: Response
  ) => {
    try {
      const conversation = await conversationService.getConversation(user.id, conversationId);

      if (!conversation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ReasonPhrases.NOT_FOUND,
        });
      }

      if (!conversation.isGroup) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: ReasonPhrases.BAD_REQUEST,
          error: "You can't leave a non-group conversation",
        });
      }

      const conversationAdmins = conversation.admin.map((admin) => admin.toString());

      const membersExceptUser = conversation.members.filter((member) => member.id.toString() !== user.id.toString());

      if (membersExceptUser.length === 1 || membersExceptUser.length === 0) {
        const io = socketManager.getIo();
        if (membersExceptUser.length === 1) {
          if (io) {
            const receiverId = socketManager.getSocketId(membersExceptUser[0].id.toString());
            if (receiverId) {
              io.to(receiverId).emit("conversation-deleted", conversationId);
            }
            await userService.incrementChatCount([membersExceptUser[0].id.toString()]);
          }
        }

        await conversationService.deleteConversation(user.id, conversationId);

        return res.status(StatusCodes.OK).json({
          status: StatusCodes.OK,
          message: ReasonPhrases.OK,
        });
      }

      let newAdmin = null;
      let newAdminObject = null;
      if (conversationAdmins.includes(user.id)) {
        newAdmin = membersExceptUser[0].id.toString();
        newAdminObject = membersExceptUser[0];
        await conversationService.updateConversation(user.id, conversationId, {
          admin: [new Types.ObjectId(newAdmin)],
        });
      }

      const updatedConversation = await conversationService.leaveConversation(user.id, conversationId);

      const io = socketManager.getIo();
      if (io) {
        membersExceptUser.forEach((member) => {
          const socketId = socketManager.getSocketId(member.id.toString());
          if (socketId) {
            io.to(socketId).emit("message", {
              senderId: user.id,
              sender: {
                _id: user.id,
                name: user.name,
                id: user.id,
              },
              message: `${user.name} left the group`,
              conversationId: conversationId.toString(),
              isQrCode: false,
              isNotification: true,
            });
            if (newAdmin && newAdminObject) {
              io.to(socketId).emit("message", {
                senderId: user.id,
                sender: {
                  _id: user.id,
                  name: user.name,
                  id: user.id,
                },
                message: `${newAdminObject.name} is now the admin`,
                conversationId: conversationId.toString(),
                isQrCode: false,
                isNotification: true,
              });
            }
          }
        });
      }

      // Add a notification message
      await messageService.create({
        content: `${user.name} left the group`,
        conversation: new Types.ObjectId(conversationId),
        sender: user.id,
        isNotification: true,
        isQrCode: false,
        scannedBy: [],
      });

      if (newAdmin && newAdminObject) {
        await messageService.create({
          content: `${newAdminObject.name} is now the admin`,
          conversation: new Types.ObjectId(conversationId),
          sender: user.id,
          isNotification: true,
          isQrCode: false,
          scannedBy: [],
        });
      }

      await userService.incrementChatCount([user.id]);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        data: updatedConversation,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
