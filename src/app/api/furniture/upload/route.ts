import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { getUserIdFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const label = formData.get("label") as string;
    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr) || 0;
    
    // Check if label exists
    if (!label) {
      return NextResponse.json({ error: "Item label is required" }, { status: 400 });
    }

    const views: Record<string, string> = {};
    const viewKeys = ["front", "back", "left", "right"];
    
    // Ensure Front image is provided
    const frontFile = formData.get("front") as File | null;
    if (!frontFile || frontFile.size === 0) {
      return NextResponse.json({ error: "Front image is required" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "furniture", userId);
    await mkdir(uploadDir, { recursive: true });

    for (const key of viewKeys) {
      const file = formData.get(key) as File | null;
      if (!file || file.size === 0) continue;

      // Validation
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json({ error: `Invalid file type for ${key} image. Only PNG, JPG, and SVG are allowed.` }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: `File size too large for ${key} image. Max 5MB.` }, { status: 400 });
      }

      const ext = path.extname(file.name) || (file.type === "image/svg+xml" ? ".svg" : ".png");
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      
      views[key] = `/uploads/furniture/${userId}/${fileName}`;
    }

    const newFurniture = {
      id: `custom-${crypto.randomUUID()}`,
      label,
      price,
      views,
      defaultWidth: 120,
      defaultHeight: 120,
    };

    user.customFurniture = user.customFurniture || [];
    user.customFurniture.push(newFurniture);
    await user.save();

    return NextResponse.json({ 
      message: "Furniture uploaded successfully", 
      item: newFurniture,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
        phone: user.phone,
        address: user.address,
        customFurniture: user.customFurniture
      }
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
