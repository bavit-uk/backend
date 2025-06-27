import { Request, Response } from "express";
import { Attendance } from "../models/attendence.model";
import { User } from "../models/user.model";
import { Shift } from "../models/workshift.model";
import { LocationService } from "../services/location.service";
import { calculateWorkingHours } from "../utils/attendanceUtils";
import { IAttendance } from "../contracts/attendence.contract";


export enum Roles {
    ADMIN = "admin",
    MANAGER = "manager",
    EMPLOYEE = "employee",
    HR = "hr"
  }

  
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { employeeId, time, location, deviceInfo } = req.body;
    const currentUser = req.user;

    // Validate input
    if (!employeeId || !time || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee is trying to mark attendance for someone else
    if (currentUser.role !== Roles.ADMIN && currentUser.id !== employeeId) {
      return res.status(403).json({ message: "Not authorized to mark attendance for this employee" });
    }

    // Get employee's current shift
    const shift = await Shift.findById(employee.workShift);
    if (!shift) {
      return res.status(400).json({ message: "Employee has no assigned work shift" });
    }

    // For On Site/Hybrid workers, validate location
    if (shift.mode !== "Remote") {
      if (!shift.location?.coordinates) {
        return res.status(400).json({ message: "Shift location not configured" });
      }

      const distance = LocationService.calculateDistance(
        { lat: location.lat, lng: location.lng },
        { 
          lat: shift.location.coordinates[1], 
          lng: shift.location.coordinates[0],
          radius: shift.location.radius || 100
        }
      );

      if (distance > (shift.location.radius || 100)) {
        return res.status(400).json({ 
          message: `You're ${Math.round(distance)}m outside your designated area (${shift.location.radius || 100}m radius)`
        });
      }
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today }
    });

    // Get address from coordinates
    const address = await LocationService.reverseGeocode(location.lat, location.lng);

    if (attendance) {
      // Update existing attendance
      attendance.checkIn = {
        time: new Date(time),
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat],
          address,
          verified: true
        },
        deviceInfo
      };
      attendance.status = "present";
    } else {
      // Create new attendance
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        shift: shift._id,
        status: "present",
        scheduledHours: calculateWorkingHours(shift.startTime, shift.endTime),
        checkIn: {
          time: new Date(time),
          location: {
            type: "Point",
            coordinates: [location.lng, location.lat],
            address,
            verified: true
          },
          deviceInfo
        }
      });
    }

    await attendance.save();
    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
};

export const markCheckOut = async (req: Request, res: Response) => {
  try {
    const { employeeId, time, location } = req.body;
    const currentUser = req.user;

    // Validate input
    if (!employeeId || !time || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check permissions
    if (currentUser.role !== Roles.ADMIN && currentUser.id !== employeeId) {
      return res.status(403).json({ message: "Not authorized to mark checkout for this employee" });
    }

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(404).json({ message: "No check-in found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out for today" });
    }

    // Get address from coordinates
    const address = await LocationService.reverseGeocode(location.lat, location.lng);

    // Update attendance with check-out
    attendance.checkOut = {
      time: new Date(time),
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
        address
      }
    };

    await attendance.save();
    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error marking checkout:", error);
    res.status(500).json({ message: "Failed to mark checkout" });
  }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const filter: any = {};

    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    // Date filtering
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate as string) };
    }

    const records = await Attendance.find(filter)
      .populate("employee", "firstName lastName email")
      .populate("shift", "shiftName mode startTime endTime")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

export const getEmployeeAttendance = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const records = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate("shift", "shiftName mode startTime endTime")
    .sort({ date: 1 });

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attendance = await Attendance.findByIdAndUpdate(id, updates, { new: true })
      .populate("employee", "firstName lastName email")
      .populate("shift", "shiftName mode startTime endTime");

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Failed to delete attendance" });
  }
};