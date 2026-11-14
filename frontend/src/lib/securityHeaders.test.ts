import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, securityHeaders } from './securityHeaders';

const directive = (policy: string, name: string) => policy.split('; ').find((part) => part.startsWith(`${name} `));

describe('buildContentSecurityPolicy', () => {
  const policy = buildContentSecurityPolicy('https://api.example.com', false);

  it('keeps the game from being framed, from loading plugins and from changing where forms and links point', () => {
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(policy, 'object-src')).toBe("object-src 'none'");
    expect(directive(policy, 'base-uri')).toBe("base-uri 'self'");
    expect(directive(policy, 'form-action')).toBe("form-action 'self'");
  });

  it('only loads scripts, styles, fonts and images from the site itself', () => {
    expect(directive(policy, 'default-src')).toBe("default-src 'self'");
    expect(directive(policy, 'script-src')).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(policy, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
    expect(directive(policy, 'font-src')).toBe("font-src 'self' data:");
    expect(directive(policy, 'img-src')).toBe("img-src 'self' data: blob:");
  });

  it('lets the page talk to the backend over HTTPS and secure WebSocket, and to nobody else', () => {
    expect(directive(policy, 'connect-src')).toBe("connect-src 'self' https://api.example.com wss://api.example.com");
    expect(policy).not.toContain('*');
  });

  it('uses the plain protocols for a backend without TLS', () => {
    expect(directive(buildContentSecurityPolicy('http://localhost:4000', false), 'connect-src'))
      .toBe("connect-src 'self' http://localhost:4000 ws://localhost:4000");
  });

  it('keeps only the origin of the backend URL', () => {
    expect(directive(buildContentSecurityPolicy('https://api.example.com:8443/socket/?x=1', false), 'connect-src'))
      .toBe("connect-src 'self' https://api.example.com:8443 wss://api.example.com:8443");
  });

  it('allows eval only while developing, because the development server needs it', () => {
    expect(policy).not.toContain('unsafe-eval');
    expect(directive(buildContentSecurityPolicy('https://api.example.com', true), 'script-src')).toContain("'unsafe-eval'");
  });

  it.each(['', 'not a url', 'ftp://example.com', 'javascript:alert(1)'])('refuses to build with the backend URL %j', (value) => {
    expect(() => buildContentSecurityPolicy(value, false)).toThrow();
  });
});

describe('securityHeaders', () => {
  const headers = Object.fromEntries(securityHeaders('https://api.example.com', false).map(({ key, value }) => [key, value]));

  it('sends the policy', () => {
    expect(headers['Content-Security-Policy']).toBe(buildContentSecurityPolicy('https://api.example.com', false));
  });

  it('never sends the address of a room to another site', () => {
    expect(headers['Referrer-Policy']).toBe('no-referrer');
  });

  it('turns off what the game does not use', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  });
});
