import { Container, getContainer } from '@cloudflare/containers';

// The NestJS app runs inside this container (built from ../Dockerfile).
export class PlaylistContainer extends Container {
  defaultPort = 3000;
  // Stop the container after 15 idle minutes. The in-memory playlist resets
  // when it starts again.
  sleepAfter = '15m';
}

interface Env {
  PLAYLIST: DurableObjectNamespace<PlaylistContainer>;
}

export default {
  // Send every request to the same single container, so all users share one
  // playlist.
  async fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.PLAYLIST).fetch(request);
  },
};
