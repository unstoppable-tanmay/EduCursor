"use client";

import { Button, Input, Select, message } from "antd";
import { runes } from "runes2";

import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { useMouse } from "@uidotdev/usehooks";
import { Editor } from "@monaco-editor/react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

var socket: Socket;
// socket = io("http://localhost:3001");
socket = io("https://educursor-backend.onrender.com/");

const Language = [
  "json",
  "markdown",
  "css",
  "typescript",
  "javascript",
  "html",
  "python",
  "scss",
  "cpp",
  "csharp",
  "dart",
  "go",
  "java",
  "kotlin",
  "perl",
  "php",
  "ruby",
  "rust",
  "swift",
];
const Language_to_Extension = new Map();
Language_to_Extension.set("json", "json");
Language_to_Extension.set("markdown", "md");
Language_to_Extension.set("css", "css");
Language_to_Extension.set("typescript", "ts");
Language_to_Extension.set("javascript", "js");
Language_to_Extension.set("html", "html");
Language_to_Extension.set("python", "py");
Language_to_Extension.set("scss", "scss");
Language_to_Extension.set("cpp", "cpp");
Language_to_Extension.set("csharp", "cs");
Language_to_Extension.set("dart", "dart");
Language_to_Extension.set("go", "go");
Language_to_Extension.set("java", "java");
Language_to_Extension.set("kotlin", "kt");
Language_to_Extension.set("perl", "pl");
Language_to_Extension.set("php", "php");
Language_to_Extension.set("ruby", "rb");
Language_to_Extension.set("rust", "rs");
Language_to_Extension.set("swift", "swift");

export default function Home() {
  const isMounted = useRef(false);
  const handle = useFullScreenHandle();

  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [id, setId] = useState<string>();

  const [mouse, ref] = useMouse<HTMLElement>();
  const [cursors, setCursors] = useState<any>();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const [messageApi, contextHolder] = message.useMessage();

  // useLayoutEffect(() => {
  //   fetch("/api/socket").then(() => {
  //     socket = io("/api/socket");
  //   });
  // }, []);

  useEffect(() => {
    // const socket = connect("http://localhost:3000/api/socket");
    // console.log(socket);

    // fetch(`http://localhost:3000/api/socket`);
    // socket = io({
    //   path: "/api/socket",
    //   addTrailingSlash: false,
    // });

    socket.connected
      ? console.log(true)
      : messageApi.open({
          type: "info",
          content: "Server Is Off",
        });

    socket.on("connect", () => {
      messageApi.open({
        type: "info",
        content: "Client Connected",
      });
    });

    socket.on("error", (data) => {
      messageApi.open({
        type: "error",
        content: data,
      });
      setIsConnected(false);
    });

    socket.on("message", (data: { msg: string; data: string }) => {
      messageApi.open({
        type: "success",
        content: data.msg,
      });
      if (data.msg == "Created The Room" || data.msg == "Joined The Room") {
        setIsConnected(true);
        setId(data.data);
      }
    });

    socket.on("update", (data: any) => {
      setCursors(data);
      console.log(data);
    });

    socket.on("update_code", (data: any) => {
      setCode(data.code);
      console.log(data);
    });

    socket.on("update_lang", (data: any) => {
      setLanguage(data.lang);
      console.log(data);
    });

    return () => {
      socket.emit("leave_room", { room: room, name: name });
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      const getData = setTimeout(() => {
        if (!socket.connected) {
          setIsConnected(false);
        }
        if (isConnected)
          socket.emit("update", {
            room: room,
            name: name,
            id: id,
            cursor: {
              x: mouse.x / window.innerWidth,
              y: mouse.y / window.innerHeight,
            },
          });
      }, 10);

      return () => clearTimeout(getData);
    } else {
      isMounted.current = true;
    }
  }, [mouse]);

  const handleJoin = () => {
    if (!socket.connected) {
      messageApi.open({
        type: "info",
        content: "Server Is Off",
      });
      return;
    }
    if (!room || !name) {
      messageApi.open({
        type: "warning",
        content: "Fill The Fields",
      });
    } else {
      socket.emit("join_room", { room: room, name: name });
    }
  };
  const handleCreate = () => {
    if (!socket.connected) {
      messageApi.open({
        type: "info",
        content: "Server Is Off",
      });
      return;
    }
    if (!room || !name) {
      messageApi.open({
        type: "warning",
        content: "Fill The Fields",
      });
    } else {
      socket.emit("create_room", { room: room, name: name });
    }
  };
  const handleLeave = async () => {
    if (!socket.connected) {
      messageApi.open({
        type: "info",
        content: "Server Is Off",
      });
      return;
    }
    socket.emit("leave_room", { room: room, name: name });
    setIsConnected(false);
  };

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setLanguage(value);
    socket.emit("update_lang", { room: room, name: name, lang: value });
  };
  const onSearch = (value: string) => {
    console.log("search:", value);
  };
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <FullScreen handle={handle}>
      <main
        className="flex min-h-screen w-screen items-center justify-center"
        ref={ref}
      >
        {contextHolder}
        {isConnected ? (
          <div className="w-full h-max flex flex-col gap-5">
            <div className="w-screen h-screen flex cursor-crosshair relative overflow-hidden items-center justify-center flex-col gap-3 ">
              <div className="header text-white/40">
                Better You Go Fullscreen. . .
              </div>
              <div
                className="get_out left-3 top-4 absolute cursor-pointer px-3 py-1 bg-gray-400/40 rounded-full "
                onClick={handleLeave}
              >
                Leave
              </div>
              <div
                className="get_out right-3 top-4 absolute cursor-pointer px-3 py-1 bg-gray-400/40 rounded-full "
                onClick={handle.enter}
              >
                FullScreen
              </div>

              <div className="h-[70vh] aspect-[3/2] max-w-[85vw] rounded-xl overflow-hidden bg-[#1e1e1e]">
                <div className="bg-slate-700 w-full px-4 py-2 flex justify-between items-center">
                  <div className="left-decorative flex gap-2">
                    <div className="gol w-4 h-4 bg-white rounded-full"></div>
                    <div className="gol w-4 h-4 bg-white rounded-full"></div>
                    <div className="gol w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="filename">
                    {room + "." + Language_to_Extension.get(language)}
                  </div>
                  <div className="select">
                    <Select
                      showSearch
                      size="small"
                      className="bg-transparent w-max"
                      placeholder="Select Language"
                      optionFilterProp="children"
                      onChange={onChange}
                      onSearch={onSearch}
                      filterOption={filterOption}
                      defaultValue={"javascript"}
                      options={Language.map((ele, ind) => {
                        return { value: ele, label: ele };
                      })}
                      value={language}
                    />
                  </div>
                </div>
                <Editor
                  className="w-full h-full mt-2"
                  defaultLanguage="javascript"
                  defaultValue="// some comment"
                  theme="vs-dark"
                  options={{
                    scrollbar: {},
                  }}
                  value={code}
                  onChange={(data) => {
                    socket.emit("update_code", {
                      room: room,
                      name: name,
                      id: id,
                      code: data,
                    });
                  }}
                  language={language}
                />
              </div>
              {Object.keys(cursors).length &&
                Object.keys(cursors).map((cursor: string, index: number) => {
                  return (
                    <div
                      key={index}
                      style={{
                        transform: `translate(${
                          cursors![cursor].x * window.innerWidth
                        }px, ${cursors![cursor].y * window.innerHeight}px)`,
                        color: `#${cursors![cursor].color}`,
                      }}
                      className={`mouse absolute pointer-events-none duration-75 top-0 left-0 z-50 font-bold`}
                    >
                      {cursors![cursor].name}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-700 border-2 border-white/70 flex flex-col gap-2">
            <div className="heading text-center font-bold">
              Join Or Create Room
            </div>
            <Input
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              pattern="[a-z]+"
              onKeyPress={(event) => {
                if (!/[a-z]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              size="large"
            />
            <Input
              placeholder="Enter Room Code"
              value={room}
              pattern="[a-z]+"
              onKeyPress={(event) => {
                if (!/[a-z]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              count={{
                show: true,
                max: 10,
                strategy: (txt) => runes(txt).length,
                exceedFormatter: (txt, { max }) =>
                  runes(txt).slice(0, max).join(""),
              }}
              onChange={(e) => {
                setRoom(e.target.value);
              }}
              size="large"
            />
            <div className="btn_grp flex gap-2 w-full items-center justify-center">
              <Button
                type="primary"
                className="bg-blue-600 w-[50%]"
                onClick={handleCreate}
                size="large"
              >
                Create
              </Button>
              <Button
                type="primary"
                className="bg-blue-600 w-[50%]"
                onClick={handleJoin}
                size="large"
              >
                Join
              </Button>
            </div>
          </div>
        )}
      </main>
    </FullScreen>
  );
}

// confetti - https://www.npmjs.com/package/react-canvas-confetti#Examples
