import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { MessageSquare, Send, Phone, Video, MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";

type User = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
};

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
};

const mockUsers: User[] = [
  {
    id: "user1",
    name: "Alice",
    avatar: "https://placehold.co/100x100/A020F0/FFFFFF/png?text=A",
    online: true,
  },
  {
    id: "user2",
    name: "Bob",
    avatar: "https://placehold.co/100x100/3498DB/FFFFFF/png?text=B",
    online: false,
  },
  {
    id: "user3",
    name: "Charlie",
    avatar: "https://placehold.co/100x100/2ECC71/FFFFFF/png?text=C",
    online: true,
  },
];

const mockMessages: Record<string, Message[]> = {
  user1: [
    {
      id: "m1",
      text: "Hey! How's the project going?",
      senderId: "user1",
      timestamp: new Date(Date.now() - 60000 * 5),
    },
    {
      id: "m2",
      text: "It's going well! Almost done with the MVP.",
      senderId: "me",
      timestamp: new Date(Date.now() - 60000 * 4),
    },
    {
      id: "m3",
      text: "That's great to hear!",
      senderId: "user1",
      timestamp: new Date(Date.now() - 60000 * 3),
    },
  ],
  user2: [
    {
      id: "m4",
      text: "Can we reschedule our meeting?",
      senderId: "user2",
      timestamp: new Date(Date.now() - 60000 * 20),
    },
  ],
  user3: [],
};

export function ChatApp({ name = "Chat App" }: { name?: string }) {
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]);
  const [messages, setMessages] = useState<Message[]>(
    mockMessages[mockUsers[0].id] || []
  );
  const [inputText, setInputText] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(mockMessages[selectedUser.id] || []);
  }, [selectedUser]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;
    const newMessage: Message = {
      id: `m${Date.now()}`,
      text: inputText,
      senderId: "me",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate a reply
    setTimeout(() => {
      const reply: Message = {
        id: `m${Date.now() + 1}`,
        text: "This is an automated reply.",
        senderId: selectedUser.id,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  const handleCall = (type: "voice" | "video") => {
    toast({
      title: "Feature Coming Soon",
      description: `The ${type} call functionality is not yet implemented.`,
    });
  };

  return (
    <Card className="flex h-full bg-transparent border-0 shadow-none">
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <Input placeholder="Search contacts..." />
        </div>
        <ScrollArea>
          {mockUsers.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 p-4 cursor-pointer hover:bg-accent",
                selectedUser.id === user.id && "bg-accent"
              )}
              onClick={() => setSelectedUser(user)}
            >
              <Avatar className="relative">
                <AvatarImage src={user.avatar} data-ai-hint="person avatar" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                {user.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </Avatar>
              <span className="font-medium">{user.name}</span>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedUser.name}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedUser.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleCall("voice")}>
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleCall("video")}>
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 bg-secondary/30 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  msg.senderId === "me" ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== "me" && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg",
                    msg.senderId === "me"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
