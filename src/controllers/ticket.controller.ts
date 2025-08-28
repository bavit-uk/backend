import { ticketService } from "@/services/ticket.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ITicket } from "@/contracts/ticket.contract";
import { Types } from "mongoose";
import { jwtVerify } from "@/utils/jwt.util";
import { authService } from "@/services";

export const tickerControler = {
  addticket: async (req: Request, res: Response) => {
    try {
      const {
        title,
        client,
        assignedTo,
        createDate,
        dueDate,
        status = "Open",
        priority = "Medium",
        role,
        description,
        isEscalated,
        chatMessageId,
        images,
        platform,
        orderReference,
        orderStatus,
      } = req.body;

      // Get user ID from token for timeline tracking
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      let userId: string | undefined;

      if (token && typeof token === "string") {
        try {
          const decoded = jwtVerify(token);
          userId = decoded.id.toString();
        } catch (error) {
          // If token is invalid, continue without user tracking
          console.warn("Invalid token for ticket creation, proceeding without user tracking");
        }
      }

      const newTicket = await ticketService.createTicket(
        title,
        client,
        assignedTo
          ? Array.isArray(assignedTo)
            ? assignedTo.map((id) => new Types.ObjectId(id))
            : [new Types.ObjectId(assignedTo)]
          : undefined,
        new Date(createDate),
        new Date(dueDate),
        status,
        priority,
        new Types.ObjectId(role),
        description,
        isEscalated,
        chatMessageId,
        images,
        platform,
        orderReference,
        orderStatus,
        userId
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Ticket created successfully",
        data: newTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error creating ticket",
        error: error.message,
      });
    }
  },

  addNote: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      if (!description?.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Note description is required",
        });
      }

      // Check if ticket exists and get its status
      const ticket = await ticketService.getById(id);
      if (!ticket) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      // Prevent adding notes to closed tickets
      if (ticket.status === "Closed") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Cannot add notes to closed tickets",
        });
      }

      const uploadedImages = Array.isArray(req.files) ? (req.files as any[]).map((f) => f.location) : [];

      const updatedTicket = await ticketService.addNote(id, description.trim(), userId, uploadedImages);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Note added successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error adding note",
      });
    }
  },

  deleteNote: async (req: Request, res: Response) => {
    try {
      const { id, noteId } = req.params as any;

      const updatedTicket = await ticketService.deleteNote(id, noteId);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Note deleted successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error deleting note",
      });
    }
  },

  editTicket: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert string IDs to ObjectId if present
      if (updateData.assignedTo) {
        updateData.assignedTo = Array.isArray(updateData.assignedTo)
          ? updateData.assignedTo.map((id: string) => new Types.ObjectId(id))
          : [new Types.ObjectId(updateData.assignedTo)];
      }
      if (updateData.role) {
        updateData.role = new Types.ObjectId(updateData.role);
      }

      const ticket = await ticketService.editTicket(id, updateData);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating ticket",
        error: error.message,
      });
    }
  },

  deleteTicket: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await ticketService.deleteTicket(id);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Ticket deleted successfully",
        deletedTicket: result,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error deleting ticket",
        error: error.message,
      });
    }
  },

  getAllTicket: async (req: Request, res: Response) => {
    try {
      const tickets = await ticketService.getAllTicket();
      res.status(StatusCodes.OK).json({ success: true, data: tickets });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error getting tickets",
        error: error.message,
      });
    }
  },

  getSpecificTicket: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await ticketService.getById(id);
      if (!result) return res.status(404).json({ message: "Ticket not found" });
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error getting ticket",
        error: error.message,
      });
    }
  },

  toggleticketstatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Open", "Assigned", "In Progress", "Closed", "Resolved"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Status must be one of: Open, Assigned, In Progress, Closed, Resolved",
      });
    }

    try {
      // Get user ID from token for timeline tracking
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      let userId: string | undefined;

      if (token && typeof token === "string") {
        try {
          const decoded = jwtVerify(token);
          userId = decoded.id.toString();
        } catch (error) {
          // If token is invalid, continue without user tracking
          console.warn("Invalid token for status change, proceeding without user tracking");
        }
      }

      const result = await ticketService.changeStatus(id, status, userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Status changed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error changing status",
        error: error.message,
      });
    }
  },

  toggleprioritystatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { priority } = req.body;

    const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

    if (!priority || !allowedPriorities.includes(priority)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Priority must be one of: Low, Medium, High, Urgent",
      });
    }

    try {
      const result = await ticketService.changePriority(id, priority);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Priority changed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error changing priority",
        error: error.message,
      });
    }
  },

  toggleRole: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Types.ObjectId.isValid(role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Valid role ID is required",
      });
    }

    try {
      const result = await ticketService.changeRole(id, new Types.ObjectId(role));
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Role changed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error changing role",
        error: error.message,
      });
    }
  },

  addResolution: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();
      const user = await authService.findUserById(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      if (!description?.trim() || description.trim().length < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Resolution must be at least 10 characters",
        });
      }

      // Check if ticket exists and get its status
      const ticket = await ticketService.getById(id);
      if (!ticket) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      // Prevent adding resolutions to closed tickets
      if (ticket.status === "Closed") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Cannot add resolution to closed tickets",
        });
      }

      // If upload middleware attached files, map their URLs for resolution images
      const uploadedImages = Array.isArray(req.files) ? (req.files as any[]).map((f) => f.location) : [];

      const resolvedTicket = await ticketService.addResolution(id, description, userId, uploadedImages);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Ticket resolved successfully",
        data: resolvedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error adding resolution",
      });
    }
  },

  deleteResolution: async (req: any, res: Response) => {
    try {
      const { id } = req.params;

      const deletedResolutionTicket = await ticketService.deleteResolution(id);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolution deleted successfully",
        data: deletedResolutionTicket,
      });
    } catch (error: any) {
      res.status(error.message.includes("not found") ? StatusCodes.NOT_FOUND : StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error deleting resolution",
      });
    }
  },

  updateResolution: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();
      const user = await authService.findUserById(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      if (!description?.trim() || description.trim().length < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Resolution must be at least 10 characters",
        });
      }

      const updatedTicket = await ticketService.updateResolution(id, description, userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolution updated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(error.message.includes("not found") ? StatusCodes.NOT_FOUND : StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error updating resolution",
      });
    }
  },

  // New endpoints for multiple resolutions
  getResolutions: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resolutions = await ticketService.getResolutions(id);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolutions retrieved successfully",
        data: resolutions,
      });
    } catch (error: any) {
      res.status(error.message.includes("not found") ? StatusCodes.NOT_FOUND : StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error retrieving resolutions",
      });
    }
  },

  deleteResolutionById: async (req: Request, res: Response) => {
    try {
      const { id, resolutionId } = req.params;
      const updatedTicket = await ticketService.deleteResolutionById(id, resolutionId);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolution deleted successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(error.message.includes("not found") ? StatusCodes.NOT_FOUND : StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Error deleting resolution",
      });
    }
  },

  uploadImages: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "No images uploaded",
        });
      }

      // Get the uploaded file URLs from DigitalOcean Spaces
      const uploadedImages = (req.files as any[]).map((file) => file.location);

      // Update the ticket with the new image URLs
      const updatedTicket = await ticketService.addImagesToTicket(id, uploadedImages);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Images uploaded successfully",
        data: {
          ticket: updatedTicket,
          uploadedImages: uploadedImages,
        },
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error uploading images",
        error: error.message,
      });
    }
  },

  updateAssignment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;

      // Get user ID from token for timeline tracking
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      let userId: string | undefined;

      if (token && typeof token === "string") {
        try {
          const decoded = jwtVerify(token);
          userId = decoded.id.toString();
        } catch (error) {
          // If token is invalid, continue without user tracking
          console.warn("Invalid token for assignment, proceeding without user tracking");
        }
      }

      // Convert string IDs to ObjectId if present
      const assignedToIds = assignedTo
        ? Array.isArray(assignedTo)
          ? assignedTo.map((id: string) => new Types.ObjectId(id))
          : [new Types.ObjectId(assignedTo)]
        : [];

      const updatedTicket = await ticketService.updateAssignment(id, assignedToIds, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Assignment updated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating assignment",
        error: error.message,
      });
    }
  },

  // Comment methods
  addComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { content, parentCommentId, images } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      if (!content?.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Comment content is required",
        });
      }

      const updatedTicket = await ticketService.addComment(id, content.trim(), userId, parentCommentId, images);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Comment added successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error adding comment",
        error: error.message,
      });
    }
  },

  updateComment: async (req: Request, res: Response) => {
    try {
      const { id, commentId } = req.params;
      const { content } = req.body;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      if (!content?.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Comment content is required",
        });
      }

      const updatedTicket = await ticketService.updateComment(id, commentId, content.trim(), userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating comment",
        error: error.message,
      });
    }
  },

  deleteComment: async (req: Request, res: Response) => {
    try {
      const { id, commentId } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      const updatedTicket = await ticketService.deleteComment(id, commentId, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Comment deleted successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error deleting comment",
        error: error.message,
      });
    }
  },

  // Manual escalation methods
  manualEscalate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      const updatedTicket = await ticketService.manualEscalate(id, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Ticket manually escalated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res
        .status(
          error.message.includes("not found") || error.message.includes("already")
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.INTERNAL_SERVER_ERROR
        )
        .json({
          success: false,
          message: error.message || "Error escalating ticket",
        });
    }
  },

  deEscalate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token || typeof token !== "string") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      const decoded = jwtVerify(token);
      const userId = decoded.id.toString();

      const updatedTicket = await ticketService.deEscalate(id, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Ticket de-escalated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res
        .status(
          error.message.includes("not found") || error.message.includes("not manually")
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.INTERNAL_SERVER_ERROR
        )
        .json({
          success: false,
          message: error.message || "Error de-escalating ticket",
        });
    }
  },
};
