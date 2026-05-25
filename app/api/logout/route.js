import { logoutUser } from '@/lib/auth'

export async function POST(request) {
  try {
    const success = await logoutUser()
    
    if (success) {
      return Response.json(
        { message: 'Logged out successfully' },
        { status: 200 }
      )
    } else {
      return Response.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
