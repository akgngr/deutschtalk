
import { ChatArea } from '@/components/chat/chat-area';
import type { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming firebase admin is not set up for server components here
import type { Match } from '@/types';

// If you need dynamic metadata based on the match:
// export async function generateMetadata(
//   { params }: { params: { matchId: string } },
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   try {
//     const matchDocRef = doc(db, 'matches', params.matchId);
//     const matchSnap = await getDoc(matchDocRef); // This uses client SDK, not ideal for RSC metadata
//     if (matchSnap.exists()) {
//       const matchData = matchSnap.data() as Match;
//       // Find partner name if possible - requires current user context or fetching both profiles
//       return {
//         title: `Chat - DeutschTalk`, // Replace with partner name if available
//       };
//     }
//   } catch (error) {
//     console.error("Error generating metadata for chat page:", error);
//   }
//   return {
//     title: 'Chat - DeutschTalk',
//     description: 'Practice German with your chat partner.',
//   };
// }


export default function ChatPage({ params }: { params: { matchId: string } }) {
  return (
    <div className="h-full"> {/* Ensure ChatArea can take full height */}
      <ChatArea matchId={params.matchId} />
    </div>
  );
}
