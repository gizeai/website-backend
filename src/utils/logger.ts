import pino from "pino";

const pinoInstance = pino({
  transport: {
    targets: [
      {
        target: "pino/file",
        options: { destination: "./logs/app.log" },
        level: "error",
      },
    ],
  },
});

function error(error: unknown) {
  console.error(error);

  if (error instanceof Error) {
    pinoInstance.error({
      msg: error.message,
      stack: error.stack,
      path: error.name,
      time: new Date().toISOString(),
    });

    return;
  }

  if (error && typeof error === "object" && "message" in error) {
    pinoInstance.error({
      msg: String(error.message),
      time: new Date().toISOString(),
    });
    return;
  }

  pinoInstance.error({
    msg: String(error),
    time: new Date().toISOString(),
  });
}

const logger = {
  error,
};

export default logger;
