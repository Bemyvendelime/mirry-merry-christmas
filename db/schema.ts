import { sqliteTable, text, real, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const visitors = sqliteTable("visitors", {
  id:text("id").primaryKey(), name:text("name").notNull(), color:text("color").notNull(),
  photo:text("photo").notNull().default(""), bio:text("bio").notNull().default(""),
  profileKey:text("profile_key").notNull().default(""),
  room:text("room").notNull().default("plaza"), visit:integer("visit").notNull().default(0),
  jumpSeq:integer("jump_seq").notNull().default(0), jumpAt:integer("jump_at").notNull().default(0),
  x:real("x").notNull(), z:real("z").notNull(), yaw:real("yaw").notNull(), seen:integer("seen").notNull(),
}, t=>[index("visitors_seen").on(t.seen)]);
export const teams=sqliteTable("teams",{plot:text("plot").primaryKey(),keyhash:text("keyhash").notNull()});
export const objects=sqliteTable("objects",{
  id:text("id").primaryKey(), plot:text("plot").notNull(), slot:integer("slot").notNull(), kind:text("kind").notNull(),
  turn:integer("turn").notNull(), version:integer("version").notNull(), op:text("op").notNull(),
});

export const roomMessages=sqliteTable("room_messages",{
  id:integer("id").primaryKey({autoIncrement:true}), room:text("room").notNull(),
  sender:text("sender").notNull(), name:text("name").notNull(), body:text("body").notNull(),
  op:text("op").notNull(), sent:integer("sent").notNull()
},t=>[index("room_message_order").on(t.room,t.id),uniqueIndex("room_message_op").on(t.sender,t.op)]);
