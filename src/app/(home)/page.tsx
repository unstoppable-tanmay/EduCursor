"use client";

import { Button, Input, message } from "antd";
import { runes } from "runes2";

import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { useMouse } from "@uidotdev/usehooks";
import { Editor,useMonaco } from "@monaco-editor/react";

var socket: Socket;
socket = io("http://localhost:3001");

export default function Home() {
  const monaco = useMonaco()

  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [id, setId] = useState<string>();

  const [mouse, ref] = useMouse();
  const [cursors, setCursors] = useState([]);
  const [code, setCode] = useState("");

  const [messageApi, contextHolder] = message.useMessage();

  console.log(monaco)

  useEffect(() => {
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
      setCode(data);
      console.log(data);
    });

    return () => {
      socket.emit("leave_room", { room: room, name: name });
    };
  }, []);

  useEffect(() => {
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

  return (
    <main className="flex min-h-screen w-screen items-center justify-center">
      {contextHolder}
      {isConnected ? (
        <div
          className="w-screen h-screen flex cursor-crosshair relative overflow-hidden items-center justify-center"
          ref={ref}
        >
          <div
            className="get_out left-3 top-4 absolute cursor-pointer px-3 py-1 bg-gray-400/40 rounded-full "
            onClick={handleLeave}
          >
            Leave
          </div>

          <div className="h-[70vh] aspect-[3/2] max-w-[85vw] rounded-xl overflow-hidden bg-[#1e1e1e]">
            <div className="bg-slate-700 w-full px-4 py-2 flex gap-2">
              <div className="gol w-3 aspect-square bg-white rounded-full"></div>
              <div className="gol w-3 aspect-square bg-white rounded-full"></div>
              <div className="gol w-3 aspect-square bg-white rounded-full"></div>
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
            />
          </div>
          {Object.keys(cursors).length &&
            Object.keys(cursors).map((cursor: string, index: number) => {
              return (
                <div
                  key={index}
                  style={{
                    transform: `translate(${
                      cursors[cursor].x * window.innerWidth
                    }px, ${cursors[cursor].y * window.innerHeight}px)`,
                    color: `#${cursors[cursor].color}`
                  }}
                  className={`mouse absolute pointer-events-none duration-75 top-0 left-0 z-50 font-bold`}
                >
                  {cursors[cursor].name}
                </div>
              );
            })}
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
            size="large"
          />
          <Input
            placeholder="Enter Room Code"
            value={room}
            count={{
              show: true,
              max: 6,
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
  );
}

// confetti - https://www.npmjs.com/package/react-canvas-confetti#Examples
