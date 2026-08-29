import { PrismaService } from '../prisma/prisma.service';

export type BotStep =
  | 'idle'
  | 'awaiting_photo'
  | 'awaiting_video'
  | 'awaiting_title'
  | 'awaiting_text'
  | 'awaiting_add_title'
  | 'awaiting_add_text'
  | 'awaiting_edit_title'
  | 'awaiting_edit_text'
  | 'awaiting_replace_media';

export interface DraftData {
  type?: 'PHOTO' | 'VIDEO';
  mediaKey?: string;
  title?: string;
  text?: string;
}

export interface SessionData {
  step: BotStep;
  draft?: DraftData;
  editingCardId?: string;
}

export async function getSession(
  prisma: PrismaService,
  userId: string,
): Promise<SessionData | null> {
  const row = await prisma.botSession.findUnique({ where: { userId } });
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data) as SessionData;
  } catch {
    return null;
  }
}

export async function setSession(
  prisma: PrismaService,
  userId: string,
  data: SessionData,
): Promise<void> {
  await prisma.botSession.upsert({
    where: { userId },
    update: { data: JSON.stringify(data) },
    create: { userId, data: JSON.stringify(data) },
  });
}

export async function resetSession(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  await prisma.botSession.deleteMany({ where: { userId } });
}
