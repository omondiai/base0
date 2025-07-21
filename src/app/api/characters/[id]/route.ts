
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// DELETE a character by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid character ID.' }, { status: 400 });
    }

    const db = await getDb();
    const charactersCollection = db.collection('characters');
    
    const result = await charactersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Character not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Character deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json({ message: 'An internal server error occurred while deleting the character.' }, { status: 500 });
  }
}
