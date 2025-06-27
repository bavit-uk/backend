import { Schema, model, Types } from "mongoose";
import { IUser } from "../contracts/user.contract";
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
export interface IAttendance {
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
const AttendanceSchema = new Schema<IAttendance>({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  shift: {
    type: Schema.Types.ObjectId,
    ref: "Shift",
    required: true
  },
  status: {
    type: String,
    enum: Object.values(AttendanceStatus),
    required: true,
    default: AttendanceStatus.PRESENT
  },
  
  // Check-in details
  checkIn: {
    time: { type: Date },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && 
                   v[1] >= -90 && v[1] <= 90;
          },
          message: "Invalid coordinates format [longitude, latitude]"
        }
      },
      address: { type: String },
      verified: { type: Boolean, default: false }
    },
    deviceInfo: {
      os: { type: String },
      browser: { type: String },
      ipAddress: { type: String }
    }
  },
  
  // Check-out details
  checkOut: {
    time: { type: Date },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && 
                   v[1] >= -90 && v[1] <= 90;
          },
          message: "Invalid coordinates format [longitude, latitude]"
        }
      },
      address: { type: String }
    }
  },
  
  // Hours tracking
  scheduledHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  workedHours: {
    type: Number,
    min: 0,
    max: 24
  },
  overtimeHours: {
    type: Number,
    min: 0
  },
  
  // Breaks tracking
  breaks: [{
    start: { type: Date, required: true },
    end: { type: Date },
    duration: { type: Number, min: 0 }, // in minutes
    type: { type: String, enum: ["lunch", "break", "meeting"] }
  }],
  totalBreakTime: {
    type: Number,
    min: 0
  },
  
  // Location verification
  locationVerified: {
    type: Boolean,
    default: false
  },
  locationVariance: {
    type: Number,
    min: 0
  },
  
  // Additional info
  notes: {
    type: String,
    maxlength: 500
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for employee-date uniqueness
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Add geospatial index for location queries
AttendanceSchema.index({ "checkIn.location.coordinates": "2dsphere" });
AttendanceSchema.index({ "checkOut.location.coordinates": "2dsphere" });

// Pre-save hook to calculate hours and validate data
AttendanceSchema.pre<IAttendance>("save", function(next) {
  // Calculate worked hours if both check-in and check-out exist
  if (this.checkIn?.time && this.checkOut?.time) {
    const msWorked = this.checkOut.time.getTime() - this.checkIn.time.getTime();
    this.workedHours = parseFloat((msWorked / (1000 * 60 * 60)).toFixed(2));
    
    // Calculate overtime (if any)
    if (this.workedHours > this.scheduledHours) {
      this.overtimeHours = parseFloat((this.workedHours - this.scheduledHours).toFixed(2));
    } else {
      this.overtimeHours = 0;
    }
  }
  
  // Calculate total break time
  if (this.breaks && this.breaks.length > 0) {
    this.totalBreakTime = this.breaks.reduce((total, brk) => {
      if (brk.duration) return total + brk.duration;
      if (brk.end) return total + ((brk.end.getTime() - brk.start.getTime()) / (1000 * 60));
      return total;
    }, 0);
  }
  
  // Set status based on check-in time and shift
  if (this.checkIn?.time) {
    const shift = this.shift as IWorkshift;
    const checkInTime = this.checkIn.time;
    const scheduledStart = new Date(checkInTime);
    
    // Parse shift start time (HH:MM)
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    scheduledStart.setHours(hours, minutes, 0, 0);
    
    // Consider late if after 15 minutes of scheduled start
    const lateThreshold = new Date(scheduledStart.getTime() + 15 * 60000);
    
    if (checkInTime > lateThreshold) {
      this.status = AttendanceStatus.LATE;
    }
  }
  
  this.updatedAt = new Date();
  next();
});

export const Attendance = model<IAttendance>("Attendance", AttendanceSchema);