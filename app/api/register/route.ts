// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/supabase";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    // Cek apakah data masuk
    console.log("Mencoba mendaftarkan:", email);

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return NextResponse.json({ message: "User sudah ada" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    console.log("User berhasil dibuat!");
    return NextResponse.json({ message: "Berhasil" }, { status: 201 });

  } catch (error) {
    // INI PENTING: Agar error muncul di terminal VS Code kamu
    console.error("ERROR REGISTER:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}