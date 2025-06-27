import {  Types, Model } from "mongoose";
import { IUser } from "./user.contract";
import { IWorkshift } from "../contracts/workshif.contracts";

// Status types with additional details
enum AttendanceStatus {
  PRESENT = "present",
  LATE = "late",
  ABSENT = "absent",
  HALF_DAY = "half-day",
  ON_LEAVE = "on-leave",
  REMOTE = "remote",
  HOLIDAY = "holiday"
}

// Location interface
interface IGeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  verified?: boolean;
}

// Break time interface
interface IBreak {
  start: Date;
  end?: Date;
  duration?: number; // in minutes
  type?: "lunch" | "break" | "meeting";
}

// Attendance document interface
 export interface Attendance extends Document{
  employee: Types.ObjectId | IUser;
  date: Date;
  shift: Types.ObjectId | IWorkshift;
  status: AttendanceStatus;
  
  // Time tracking
  checkIn?: {
    time: Date;
    location: IGeoLocation;
    deviceInfo?: {
      os?: string;
      browser?: string;
      ipAddress?: string;
    };
  };
  
  checkOut?: {
    time: Date;
    location: IGeoLocation;
  };
  
  // Working hours
  scheduledHours: number;
  workedHours?: number;
  overtimeHours?: number;
  
  // Breaks
  breaks?: IBreak[];
  totalBreakTime?: number; // in minutes
  
  // Location verification
  locationVerified?: boolean;
  locationVariance?: number; // in meters
  
  // Additional info
  notes?: string;
  approved?: boolean;
  approvedBy?: Types.ObjectId | IUser;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

// Attendance schema


  export type IAttendance = Model<Attendance>