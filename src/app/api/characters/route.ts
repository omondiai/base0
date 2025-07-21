
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { z } from 'zod';

const CharacterSchema = z.object({
  name: z.string().min(1, "Character name is required."),
  images: z.array(z.object({
    dataUri: z.string(),
    size: z.number(),
  })).min(1, "At least one image is required."),
});

// GET all characters
export async function GET() {
  try {
    const db = await getDb();
    const charactersCollection = db.collection('characters');
    const characters = await charactersCollection.find({}).sort({ createdAt: -1 }).toArray();

    const totalSize = characters.reduce((acc, char) => {
        return acc + char.images.reduce((imgAcc: any, img: any) => imgAcc + img.size, 0);
    }, 0);

    return NextResponse.json({ success: true, characters, totalSize }, { status: 200 });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'An internal server error occurred while fetching characters.' }, { status: 500 });
  }
}


// POST a new character
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = CharacterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { name, images } = validation.data;

    const db = await getDb();
    const charactersCollection = db.collection('characters');

    const existingCharacter = await charactersCollection.findOne({ name });
    if (existingCharacter) {
      return NextResponse.json({ message: 'A character with this name already exists.' }, { status: 409 });
    }

    const newCharacter = {
      name,
      images,
      createdAt: new Date(),
    };

    const result = await charactersCollection.insertOne(newCharacter);

    return NextResponse.json({ success: true, message: 'Character created successfully.', characterId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json({ message: 'An internal server error occurred while creating the character.' }, { status: 500 });
  }
}
