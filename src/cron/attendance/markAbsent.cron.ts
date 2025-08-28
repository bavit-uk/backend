import nodeCron from "node-cron";
import { markAbsentForUsers } from "@/services/attendance.service";

export const markAbsentCron = () => {
  nodeCron.schedule("0 0 */2 * * 1-5", async () => {
    await markAbsentForUsers();
    console.log("Mark Absent cron job executed");
  });
};
