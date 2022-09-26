import { Strategy as LocalStrategy } from "passport-local";
import Webhead from "webhead";

const localStrategy = new LocalStrategy(async (username, password, done) => {
  if (!username || !password)
    return done({ code: 422, data: "Missing Fields.", success: false }, false);

  username = username.substring(0, 6);

  try {
    // @ts-ignore
    const webhead = new Webhead();

    await webhead.get("http://spider.rangitoto.school.nz/");

    const redirect = webhead.$("#redirect")[0];

    if (redirect) {
      await webhead.get(redirect.attribs.href);
    }

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
          PageIdentityName: "RangiHub",
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

    return done(null, {
      info: {
        name: studentInfo.KnownAs,
        key: studentInfo.StudentKey,
        id: studentInfo.StudentID,
        email: studentInfo.Email,
        image: studentInfo.ImageNameEncrypted,
      },
      cookie: webhead.cookie,
    });
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
