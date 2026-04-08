import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { validateChatMessage } from "../lib/chatFilter";

export default function registerChatHandlers(io: Server, socket: Socket) {
  
  socket.on("join_project", async (data: { projectId: string; userId: string }) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: { client: true, engineer: true }
      });

      if (!project) return;

      const isClient = project.client?.userId === data.userId;
      const isEngineer = project.engineer?.userId === data.userId;

      if (isClient || isEngineer) {
        socket.join(`project_${data.projectId}`);
      } else {
        socket.emit("message_error", { message: "Unauthorized" });
      }
    } catch {
      socket.emit("message_error", { message: "Internal Server Error" });
    }
  });

  socket.on("send_message", async (data: { projectId: string; senderId: string; content: string }) => {
    try {

      const validation = validateChatMessage(data.content);
      if (!validation.isValid) {
        socket.emit("message_error", { message: validation.reason });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: { client: true, engineer: true }
      });

      if (!project){
        return socket.emit("message_error", { message: "Project not found." });
      }

      const isClient = project.client?.userId === data.senderId;
      const isEngineer = project.engineer?.userId === data.senderId;

      if (!isClient && !isEngineer){
        return socket.emit("message_error", { message: "Unauthorized" });
      }

      const savedMessage = await prisma.chatMessage.create({
        data: {
          projectId: data.projectId,
          senderId: data.senderId,
          content: data.content
        },
        include: { sender: { select: { name: true, role: true, image: true } } }
      });

      io.to(`project_${data.projectId}`).emit("receive_message", savedMessage);
    } catch {
      socket.emit("message_error", { message: "Failed to send message" });
    }
  });

  socket.on("edit_message", async (data: { messageId: string; senderId: string; content: string }) => {
    try {
      const existingMessage = await prisma.chatMessage.findUnique({ where: { id: data.messageId } });
      if (!existingMessage){
        return socket.emit("message_error", { message: "Message not found" });
      }

      if (existingMessage.senderId !== data.senderId) {
        return socket.emit("message_error", { message: "You can only edit your own messages" });
      }

      const validation = validateChatMessage(data.content);
      if (!validation.isValid) {
        return socket.emit("message_error", { message: validation.reason });
      }

      const updatedMessage = await prisma.chatMessage.update({
        where: { id: data.messageId },
        data: { 
          content: data.content,
          isEdited: true 
        },
        include: { sender: { select: { name: true, role: true, image: true } } }
      });

      io.to(`project_${existingMessage.projectId}`).emit("message_edited", updatedMessage);
    } catch {
      socket.emit("message_error", { message: "Failed to edit message" });
    }
  });

  socket.on("delete_message", async (data: { messageId: string; senderId: string }) => {
    try {
      const existingMessage = await prisma.chatMessage.findUnique({ where: { id: data.messageId } });
      if (!existingMessage){
        return socket.emit("message_error", { message: "Message not found" });
      }

      if (existingMessage.senderId !== data.senderId) {
        return socket.emit("message_error", { message: "You can only delete your own messages" });
      }

      const projectId = existingMessage.projectId;

      await prisma.chatMessage.delete({ where: { id: data.messageId } });

      io.to(`project_${projectId}`).emit("message_deleted", { messageId: data.messageId });
    } catch {
      socket.emit("message_error", { message: "Failed to delete message" });
    }
  });
}