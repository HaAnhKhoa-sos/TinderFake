// backend/routes/gameRoutes.js
import express from "express"
import { supabase } from "../lib/supabaseClient.js"

const router = express.Router()

// 🔹 Lấy danh sách game (để sau này nếu cần show list game)
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("games")
    .select("id, name, description, type")

  if (error) {
    console.error("❌ Lỗi GET /api/games:", error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: "ok", games: data })
})

// 🔹 Lấy chi tiết 1 game
router.get("/:id", async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("❌ Lỗi GET /api/games/:id:", error.message)
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: "ok", game: data })
})

// 🔥 API dùng chung cho MỌI GAME: /api/games/play
router.post("/play", async (req, res) => {
  const { userId, gameId, traits, score } = req.body

  console.log("[API] /api/games/play")
  console.log("➡️ userId:", userId)
  console.log("➡️ gameId:", gameId)
  console.log("➡️ traits gửi lên:", JSON.stringify(traits, null, 2))

  if (!userId || !gameId) {
    return res.status(400).json({ error: "Thiếu userId hoặc gameId" })
  }

  try {
    // 1️⃣ Lấy profile hiện tại (nếu có)
    const { data: existingProfile, error: profileSelectError } = await supabase
      .from("profiles")
      .select("id, username, traits")
      .eq("id", userId)
      .maybeSingle()

    if (profileSelectError && profileSelectError.code !== "PGRST116") {
      console.error("❌ Lỗi select profiles:", profileSelectError)
      throw profileSelectError
    }

    // 2️⃣ Nếu chưa có profile hoặc username rỗng → tạo username tạm
    const fallbackUsername = `user_${userId.slice(0, 8)}`
    const currentUsername =
      existingProfile?.username && existingProfile.username.trim() !== ""
        ? existingProfile.username
        : fallbackUsername

    // 3️⃣ Merge traits cũ + traits mới
    const oldTraits = existingProfile?.traits || {}
    const newTraits = traits || {}
    const mergedTraits = { ...oldTraits, ...newTraits }

    // 4️⃣ Upsert profiles: đảm bảo có row + update traits
    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: currentUsername,
          traits: mergedTraits
        },
        { onConflict: "id" }
      )

    if (profileUpsertError) {
      console.error("❌ Lỗi upsert profiles + traits:", profileUpsertError)
      throw profileUpsertError
    }

    // 5️⃣ Lưu game_sessions (log lần chơi game)
    const { data: sessionRow, error: sessionError } = await supabase
      .from("game_sessions")
      .insert({
        user_id: userId,
        game_id: gameId,
        extracted_traits: traits || {},
        score: score ?? 0
      })
      .select()
      .single()

    if (sessionError) {
      console.error("❌ Lỗi khi insert game_sessions:", sessionError)
      throw sessionError
    }

    return res.json({
      message: "ok",
      session: sessionRow,
      traits: mergedTraits
    })
  } catch (error) {
    console.error("🔥 Lỗi trong /api/games/play:", error.message || error)
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" })
  }
})

export default router
