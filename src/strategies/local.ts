import { Strategy as LocalStrategy } from "passport-local";
import Webhead from "webhead";
import moment from "moment";
import fetch from "node-fetch";

const localStrategy = new LocalStrategy(async (username, password, done) => {
  if (!username || !password)
    return done({ code: 422, data: "Missing Fields.", success: false }, false);

  username = username.substring(0, 6);

  try {
    // @ts-ignore
    const webhead = new Webhead();

    await webhead.get("http://spider.rangitoto.school.nz/");

    const authState = webhead.$('input[type="hidden"]')[0].attribs.value;

    if (
      (
        await webhead.submit(`form`, {
          AuthState: authState,
          username: username,
          password: password,
        })
      ).data?.includes("incorrect")
    )
      return done(
        { code: 401, data: "Incorrect Credentials.", success: false },
        false
      );

    await webhead.submit("form", {});

    await webhead.post(
      "https://spider.rangitoto.school.nz/Spider/Handlers/Login.asmx/Initialize_LoginPage",
      {
        json: {
          PageIdentityName: username,
          otp: "",
          login: "",
          type: "",
          ts: "",
        },
      }
    );

    const studentInfo = JSON.parse(
      (
        await webhead.post(
          "https://spider.rangitoto.school.nz/Spider/Handlers/Student.asmx/GetStudents_IncludeHub",
          {
            json: {
              StudentKey: "",
              Surname: "",
              KnownAs: "",
              GivenName: "",
              Family: "",
              CurrentYear: "",
              Gender: "",
              Email: "",
              HomeTeacher: "",
              MemberHash: username,
              ShowDeparted: false,
              Barcode: "",
              CallHub: true,
            },
          }
        )
      ).data
    ).d[0];

    const timetable = JSON.parse(
      (
        await webhead.post(
          "https://spider.rangitoto.school.nz/Spider/Handlers/Timetable.asmx/GetTimeTable_ByStudentMode",
          {
            json: {
              StudentKey: studentInfo.StudentKey,
              Date: moment().format("DD/MM/YYYY"),
              Mode: "STT",
            },
          }
        )
      ).data
    ).d;

    const photoResponse = await fetch(
      `https://spider.rangitoto.school.nz/Spider/Handlers/ImageHandler.ashx?imageHeight=200&arg=${encodeURIComponent(
        studentInfo.ImageNameEncrypted
      )}`,
      { headers: { cookie: webhead.cookie } }
    );

    const photoData = `data:${photoResponse.headers.get(
      "content-type"
    )};base64,${Buffer.from(await photoResponse.buffer()).toString("base64")}`;

    return done(null, photoData);

    return done(null, { studentInfo, timetable, photoData });
  } catch (e) {
    console.error(e);

    return done(
      {
        code: 500,
        data: "Unexpected Error Occurred. Please Try Again Later.",
        success: false,
      },
      false
    );
  }
});

export default localStrategy;
