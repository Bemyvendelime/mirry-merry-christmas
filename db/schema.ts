import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";
export const visitors = sqliteTable("visitors", {
  id:text("id").primaryKey(), name:text("name").notNull(), color:text("color").notNull(),
  x:real("x").notNull(), z:real("z").notNull(), yaw:real("yaw").notNull(), seen:integer("seen").notNull(),
}, t=>[index("visitors_seen").on(t.seen)]);
export const teams=sqliteTable("teams",{plot:text("plot").primaryKey(),keyhash:text("keyhash").notNull()});
export const objects=sqliteTable("objects",{
  id:text("id").primaryKey(), plot:text("plot").notNull(), slot:integer("slot").notNull(), kind:text("kind").notNull(),
  turn:integer("turn").notNull(), version:integer("version").notNull(), op:text("op").notNull(),
});
