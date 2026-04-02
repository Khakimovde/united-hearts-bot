import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ADMIN_ID = 5326022510;
const CHANNEL_USERNAME = "BloomPayuz";
const MINI_APP_URL = "https://bloompay.c1621.coresuz.ru";
const TERMS_URL = "https://terms.c1621.coresuz.ru";
const SUPPORT_BOT = "http://t.me/BloomPay_Supbot";
const CHANNEL_LINK = "https://t.me/BloomPayuz";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function tgApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function deleteMessage(chatId: number, messageId: number) {
  try {
    await tgApi("deleteMessage", { chat_id: chatId, message_id: messageId });
  } catch {}
}

interface UserState {
  step: string;
  phone?: string;
  referral_code?: string;
}

async function getUserState(userId: number, username: string, firstName: string): Promise<UserState> {
  const { data: existingUser } = await supabase
    .from("users")
    .select("telegram_id")
    .eq("telegram_id", String(userId))
    .maybeSingle();

  if (existingUser) {
    return { step: "done" };
  }

  const { data: state } = await supabase
    .from("telegram_user_states")
    .select("*")
    .eq("telegram_id", String(userId))
    .maybeSingle();

  if (state) {
    return {
      step: state.step,
      phone: state.phone || undefined,
      referral_code: state.referral_code || undefined,
    };
  }

  await supabase.from("telegram_user_states").insert({
    telegram_id: String(userId),
    username,
    first_name: firstName,
    step: "welcome",
  });

  return { step: "welcome" };
}

async function setUserStep(userId: number, step: string, extra?: Record<string, unknown>) {
  await supabase
    .from("telegram_user_states")
    .update({ step, ...extra, updated_at: new Date().toISOString() })
    .eq("telegram_id", String(userId));
}

async function checkChannelMembership(userId: number): Promise<boolean> {
  try {
    const res = await tgApi("getChatMember", {
      chat_id: `@${CHANNEL_USERNAME}`,
      user_id: userId,
    });
    if (res.ok) {
      const status = res.result?.status;
      return ["member", "administrator", "creator"].includes(status);
    }
    return false;
  } catch {
    return false;
  }
}

async function sendNotification(chatId: number | string, text: string) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}

async function handleStart(chatId: number, userId: number, username: string, firstName: string, startParam?: string) {
  const state = await getUserState(userId, username, firstName);

  if (state.step === "done") {
    await showMainMenu(chatId, firstName);
    return;
  }

  if (startParam && startParam.startsWith("ref_")) {
    await supabase
      .from("telegram_user_states")
      .update({ referral_code: startParam })
      .eq("telegram_id", String(userId));
  }

  // Send sticker first
  await tgApi("sendSticker", {
    chat_id: chatId,
    sticker: "CAACAgIAAxkBAAEBJ2Nn69FRwuT3a5aQz3fKz0-6AAH5eQACVAADQbVWDLchiEMDleYzNgQ",
  });

    await tgApi("sendMessage", {
    chat_id: chatId,
    text: `Assalomu alaykum, <b>${firstName}</b>! 🌱\n\nBloomPay ilovasiga xush kelibsiz!\n\n🌳 Virtual bog'dorchilik o'yini — daraxt o'stiring, meva yig'ing va haqiqiy pul ishlang!\n\nDavom etish uchun foydalanuvchi shartlarini tasdiqlang:\n\n⚠️ <i>Tasdiqlash tugmasini bosganingizda siz bot qoidalariga rozilik bildirgan bo'lasiz.</i>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Foydalanuvchi shartlari", web_app: { url: TERMS_URL } }],
        [{ text: "✅ Tasdiqlayman", callback_data: "accept_terms" }],
      ],
    },
  });

  await setUserStep(userId, "terms");
}

async function showMainMenu(chatId: number, firstName: string) {
  // Send welcome sticker
  await tgApi("sendSticker", {
    chat_id: chatId,
    sticker: "CAACAgIAAxkBAAEBJ2Nn69FRwuT3a5aQz3fKz0-6AAH5eQACVAADQbVWDLchiEMDleYzNgQ",
  });

  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `Xush kelibsiz, <b>${firstName}</b>! 🎉\n\n🌱 <b>BloomPay</b> — virtual bog'dorchilik o'yini.\n\n🌳 Daraxt eking\n💧 Suv quying\n🍎 Meva yig'ing\n💰 Tangalarni haqiqiy pulga aylantiring!`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Ochish", web_app: { url: MINI_APP_URL } }],
        [
          { text: "📢 Kanal", url: CHANNEL_LINK },
          { text: "🆘 Aloqa", url: SUPPORT_BOT },
        ],
        [{ text: "📋 Foydalanuvchi shartlari", web_app: { url: TERMS_URL } }],
      ],
    },
  });
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  const firstName = callbackQuery.from.first_name || "Foydalanuvchi";
  const username = callbackQuery.from.username || `user_${userId}`;

  await tgApi("answerCallbackQuery", { callback_query_id: callbackQuery.id });

  if (data === "accept_terms") {
    await deleteMessage(chatId, messageId);
    await setUserStep(userId, "phone", { terms_accepted_at: new Date().toISOString() });

    await tgApi("sendMessage", {
      chat_id: chatId,
      text: "Telefon raqamingizni yuboring\n\nQuyidagi tugmani bosing:",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          [{ text: "Raqamni yuborish", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } else if (data === "check_channel") {
    const isMember = await checkChannelMembership(userId);
    if (isMember) {
      await deleteMessage(chatId, messageId);

      const { data: stateData } = await supabase
        .from("telegram_user_states")
        .select("referral_code, phone")
        .eq("telegram_id", String(userId))
        .maybeSingle();

      const referralCode = stateData?.referral_code || null;
      const userCode = `ref_${userId}_${Date.now().toString(36)}`;
      const userPhone = stateData?.phone || "";

      let photoUrl: string | null = null;
      try {
        const profilePhotos = await tgApi("getUserProfilePhotos", { user_id: userId, limit: 1 });
        if (profilePhotos.ok && profilePhotos.result?.total_count > 0) {
          const fileId = profilePhotos.result.photos[0][0].file_id;
          const fileInfo = await tgApi("getFile", { file_id: fileId });
          if (fileInfo.ok) {
            photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
          }
        }
      } catch {}

      const { error } = await supabase.from("users").insert({
        telegram_id: String(userId),
        username,
        first_name: firstName,
        photo_url: photoUrl,
        referral_code: userCode,
        referred_by: referralCode,
        phone: userPhone,
      });

      if (!error && referralCode) {
        const { data: referrer } = await supabase
          .from("users")
          .select("telegram_id, coins, referral_earnings")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (referrer) {
          await supabase.from("referrals").insert({
            referrer_telegram_id: referrer.telegram_id,
            referred_telegram_id: String(userId),
          });

          const { count: refCount } = await supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_telegram_id", referrer.telegram_id);

          await sendNotification(
            referrer.telegram_id,
            `🎉 Yangi referal!\n\n` +
            `${firstName} (@${username}) sizga referal bo'ldi!\n` +
            `Jami referallaringiz: ${(refCount || 0)} ta\n` +
            `Endi ular ishlagan tangadan foiz olasiz!`
          );
        }
      }

      await supabase
        .from("telegram_user_states")
        .update({
          step: "done",
          channel_verified_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("telegram_id", String(userId));

      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "Tabriklaymiz! Muvaffaqiyatli ro'yxatdan o'tdingiz!",
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true },
      });

      await showMainMenu(chatId, firstName);
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "Siz hali kanalga obuna bo'lmagansiz!\n\nAvval kanalga obuna bo'ling, keyin tekshiring.",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Kanalga o'tish", url: CHANNEL_LINK }],
            [{ text: "Tekshirish", callback_data: "check_channel" }],
          ],
        },
      });
    }
  }
}

async function handleContact(message: any) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const firstName = message.from.first_name || "Foydalanuvchi";

  const state = await getUserState(userId, message.from.username || `user_${userId}`, firstName);
  if (state.step !== "phone") return;

  const phone = message.contact?.phone_number || "";

  await setUserStep(userId, "channel", { phone });

  await tgApi("sendMessage", {
    chat_id: chatId,
    text: "Raqam qabul qilindi!",
    parse_mode: "HTML",
    reply_markup: { remove_keyboard: true },
  });

  // Send channel sticker
  await tgApi("sendSticker", {
    chat_id: chatId,
    sticker: "CAACAgIAAxkBAAEBJ2Nn69FRwuT3a5aQz3fKz0-6AAH5eQACVAADQbVWDLchiEMDleYzNgQ",
  });

  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `📢 Endi rasmiy kanalimizga obuna bo'ling:\n\n👉 @${CHANNEL_USERNAME}\n\n✅ Obuna bo'lgach, pastdagi "Tekshirish" tugmasini bosing:`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📢 Kanalga o'tish", url: CHANNEL_LINK }],
        [{ text: "✅ Tekshirish", callback_data: "check_channel" }],
      ],
    },
  });
}

async function handlePaymentNotification(userTelegramId: string, amount: number, amountUzs: number, status: string) {
  if (status === "approved") {
    await sendNotification(
      userTelegramId,
      `So'rovingiz tasdiqlandi!\n\n` +
      `${amount.toLocaleString()} tanga (${amountUzs.toLocaleString()} UZS) to'lov so'rovingiz tasdiqlandi.\n\n` +
      `Tez orada hisobingizga o'tkaziladi.`
    );
  } else if (status === "paid") {
    await sendNotification(
      userTelegramId,
      `To'lov amalga oshirildi!\n\n` +
      `Sizning ${amount.toLocaleString()} tanga (${amountUzs.toLocaleString()} UZS) to'lovingiz muvaffaqiyatli amalga oshirildi!\n\n` +
      `Pul kartangizga o'tkazildi.`
    );
  } else if (status === "rejected") {
    await sendNotification(
      userTelegramId,
      `To'lov rad etildi\n\n` +
      `Sizning ${amount.toLocaleString()} tanga to'lov so'rovingiz rad etildi.\n` +
      `Aloqa markazi orqali murojaat qiling.`
    );
  }
}

serve(async (req) => {
  if (req.method === "POST") {
    try {
      const body = await req.json();

      if (body.action === "check_channel_membership") {
        const userId = Number(body.user_id);
        const channelId = body.channel_id;
        console.log(`Checking membership: user=${userId}, channel=${channelId}`);
        try {
          const res = await tgApi("getChatMember", {
            chat_id: channelId,
            user_id: userId,
          });
          console.log(`getChatMember result:`, JSON.stringify(res));
          const isMember = res.ok && ["member", "administrator", "creator"].includes(res.result?.status);
          return new Response(JSON.stringify({ ok: true, is_member: isMember }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        } catch (e) {
          console.error("check_channel_membership error:", e);
          return new Response(JSON.stringify({ ok: true, is_member: false }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      }

      if (body.action === "notify_payment") {
        await handlePaymentNotification(
          body.user_telegram_id,
          body.amount,
          body.amount_uzs,
          body.status
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const update = body;

      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const username = msg.from.username || `user_${userId}`;
        const firstName = msg.from.first_name || "Foydalanuvchi";

        if (msg.text?.startsWith("/start")) {
          const startParam = msg.text.split(" ")[1];
          await handleStart(chatId, userId, username, firstName, startParam);
        } else if (msg.contact) {
          await handleContact(msg);
        } else {
          const state = await getUserState(userId, username, firstName);
          if (state.step === "done") {
            await showMainMenu(chatId, firstName);
          } else if (state.step === "phone") {
            await tgApi("sendMessage", {
              chat_id: chatId,
              text: "Iltimos, quyidagi tugmani bosib telefon raqamingizni yuboring:",
              parse_mode: "HTML",
              reply_markup: {
                keyboard: [
                  [{ text: "Raqamni yuborish", request_contact: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
              },
            });
          } else if (state.step === "channel") {
            await tgApi("sendMessage", {
              chat_id: chatId,
              text: "Iltimos, kanalga obuna bo'ling va tekshiring:",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Kanalga o'tish", url: CHANNEL_LINK }],
                  [{ text: "Tekshirish", callback_data: "check_channel" }],
                ],
              },
            });
          } else if (state.step === "terms" || state.step === "welcome") {
            await tgApi("sendMessage", {
              chat_id: chatId,
              text: `Iltimos, shartlarni o'qib tasdiqlang:`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Foydalanuvchi shartlari", web_app: { url: TERMS_URL } }],
                  [{ text: "Tasdiqlayman", callback_data: "accept_terms" }],
                ],
              },
            });
          }
        }
      }

      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error processing update:", err);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("setup") === "true") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-bot`;
      const result = await tgApi("setWebhook", {
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      });
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ status: "Bot is running" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});
