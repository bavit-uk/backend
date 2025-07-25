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
      } = req.body;

      const newTicket = await ticketService.createTicket(
        title,
        client,
        assignedTo ? new Types.ObjectId(assignedTo) : undefined,
        new Date(createDate),
        new Date(dueDate),
        status,
        priority,
        new Types.ObjectId(role),
        description
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Ticket created successfully",
        data: newTicket
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error creating ticket",
        error: error.message
      });
    }
  },

  editTicket: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert string IDs to ObjectId if present
      if (updateData.assignedTo) {
        updateData.assignedTo = new Types.ObjectId(updateData.assignedTo);
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
        error: error.message
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
        error: error.message
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
        error: error.message
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
        error: error.message
      });
    }
  },

  toggleticketstatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Open", "In Progress", "Closed", "Resolved"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Status must be one of: Open, In Progress, Closed, Resolved",
      });
    }

    try {
      const result = await ticketService.changeStatus(id, status);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Status changed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error changing status",
        error: error.message
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
        error: error.message
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
        error: error.message
      });
    }
  },

  addResolution: async (req: any, res: Response) => {
    try {
      const { ticketId } = req.params;
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

      const resolvedTicket = await ticketService.addResolution(
        ticketId,
        description,
        userId
      );

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
      const { ticketId } = req.params;

      const deletedResolutionTicket = await ticketService.deleteResolution(ticketId);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolution deleted successfully",
        data: deletedResolutionTicket,
      });
    } catch (error: any) {
      res.status(
        error.message.includes('not found') 
          ? StatusCodes.NOT_FOUND 
          : StatusCodes.INTERNAL_SERVER_ERROR
      ).json({
        success: false,
        message: error.message || "Error deleting resolution",
      });
    }
  },

  updateResolution: async (req: any, res: Response) => {
    try {
      const { ticketId } = req.params;
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

      const updatedTicket = await ticketService.updateResolution(
        ticketId,
        description,
        userId
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Resolution updated successfully",
        data: updatedTicket,
      });
    } catch (error: any) {
      res.status(
        error.message.includes('not found') 
          ? StatusCodes.NOT_FOUND 
          : StatusCodes.INTERNAL_SERVER_ERROR
      ).json({
        success: false,
        message: error.message || "Error updating resolution",
      });
    }
  }
};