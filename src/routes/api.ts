import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.get("/timetableSummary", async (req, res) => {
  const isAuthenticated = !!req.user;

  if (!isAuthenticated)
    return res
      .status(401)
      .json({ code: 401, data: "You are not logged in.", success: false });

  try {
    const attendanceData = await (
      await fetch(
        "https://spider.rangitoto.school.nz/Spider/Handlers/Attendance.asmx/GetStudentAttendanceSummary",
        {
          method: "POST",
          headers: {
            Host: "spider.rangitoto.school.nz",
            Cookie: req.user.cookie,
            "Content-Type": "application/json",
          },
          redirect: "manual",
          body: JSON.stringify({
            studentID: req.user.u_dat.studentInfo.StudentID,
            strFromDate: "",
            strToDate: "",
          }),
        }
      )
    ).json();

    const lastTwoWeeks = Object.values(attendanceData.d.WeekAttendance).slice(
      -2
    );

    const attentionCodes = [
      {
        code: "M",
        justified: true,
        explanation: "Student absent due to short-term illness/medical reasons",
      },
      {
        code: "J",
        justified: true,
        explanation:
          "Justified absence – the reason is within the school policy",
      },
      {
        code: "U",
        justified: true,
        explanation: "Student is Stood down or Suspended",
      },
      {
        code: "T",
        justified: false,
        explanation:
          "No information provided – truant (or throw-away explanation)",
      },
      {
        code: "E",
        justified: false,
        explanation:
          "Student is absent. The reason is Explained, but Unjustified",
      },
      {
        code: "G",
        justified: false,
        explanation: "Holiday during term time",
      },
      {
        code: "O",
        justified: false,
        explanation: "Family reunification",
      },
      {
        code: "?",
        justified: false,
        explanation: "Unknown reason (A temporary code)",
      },
    ];

    let attentionPeriods: any[] = [];

    lastTwoWeeks.forEach((week: any) => {
      const days = Object.values(week.DayAttendance);

      days.forEach((day: any) => {
        const periods = Object.values(day.Status);

        periods.forEach((period: any) => {
          const code: any = attentionCodes.find(
            (code) => code.code === period.SchoolCode
          );

          if (code) {
            attentionPeriods.push({
              date: day.Date,
              class: { subject: period.Subject, teacher: period.Teacher },
              ...code,
            });
          }
        });
      });
    });

    return res.status(200).json({
      code: 200,
      data: {
        from: (lastTwoWeeks[0] as any).StartDate,
        to: (lastTwoWeeks.at(-1) as any).EndDate,
        attentionPeriods,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      code: 500,
      data: "Unexpected Error Occurred. Please Try Again Later.",
      success: false,
    });
  }
});

export = router;
