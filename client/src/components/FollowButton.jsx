import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/features/profiles/hooks';
import { useToggleFollow } from '@/features/follows/hooks';
import { Button } from '@/components/ui/Button';
import { readApiError } from '@/lib/apiError';

/**
 * Self-contained follow toggle. Given a profile `handle` (username or id), it
 * reads follow-state from the shared profile query and flips it optimistically.
 * Renders nothing when viewing your own profile.
 */
export function FollowButton({ handle, size = 'sm', className }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile(handle);
  const toggle = useToggleFollow(handle);

  if (!profile || profile.isMe) return null;

  const isFollowing = Boolean(profile.isFollowing);

  function onClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    toggle.mutate(
      { userId: profile.id, isFollowing },
      { onError: (err) => toast.error(readApiError(err)) },
    );
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'secondary' : 'primary'}
      onClick={onClick}
      isLoading={toggle.isPending}
      leftIcon={isFollowing ? <UserCheck /> : <UserPlus />}
      className={className}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
