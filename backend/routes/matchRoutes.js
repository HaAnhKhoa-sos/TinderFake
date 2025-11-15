import express from "express";
import { supabase } from "../lib/supabaseClient.js"; // 👈 Dùng client chung

const router = express.Router();

// 🔹 Hàm tính độ tương hợp giữa 2 bộ traits
function calculateCompatibility(aTraits = {}, bTraits = {}) {
  if (!aTraits || !bTraits) return 0;
  const keys = Object.keys(aTraits);
  if (keys.length === 0) return 0;

  let matches = 0;
  let compared = 0;

  for (const key of keys) {
    if (bTraits.hasOwnProperty(key)) {
      compared++;
      if (aTraits[key] === bTraits[key]) matches++;
    }
  }

  return compared === 0 ? 0 : Math.round((matches / compared) * 100);
}

// 🔹 API chính: GET /api/match/recommendations?userId=xxx
router.get("/recommendations", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Thiếu userId" });

  try {
    // 1️⃣ Lấy traits của user hiện tại từ bảng profiles
    const { data: myProfile, error: myErr } = await supabase
      .from("profiles")
      .select("traits")
      .eq("id", userId)
      .single();

    if (myErr) throw myErr;
    const myTraits = myProfile?.traits || {};

    // 2️⃣ Lấy toàn bộ người dùng khác (và traits của họ)
    const { data: others, error: othersErr } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url, city, traits")
      .neq("id", userId);

    if (othersErr) throw othersErr;

    // 3️⃣ Lấy danh sách người mà user này đã like
    const { data: likes } = await supabase
      .from("likes")
      .select("to_user")
      .eq("from_user", userId);

    const likedIds = likes?.map((l) => l.to_user) || [];

    // 4️⃣ Tính điểm tương hợp từng người
    const results = others
      .filter((o) => !likedIds.includes(o.id)) // bỏ người đã like
      .map((o) => {
        const theirTraits = o.traits || {};
        const compatibility =
          Object.keys(myTraits).length > 0
            ? calculateCompatibility(myTraits, theirTraits)
            : 0;
        return { ...o, compatibility };
      })
      .sort((a, b) => b.compatibility - a.compatibility);

    res.json({ message: "ok", results });
  } catch (err) {
    console.error("❌ Lỗi /api/match/recommendations:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
