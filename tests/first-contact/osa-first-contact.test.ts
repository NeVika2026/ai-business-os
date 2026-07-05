import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  hasSeenOsaFirstContact,
  markOsaFirstContactSeen,
  OSA_FIRST_CONTACT_CLOSING_TAGLINE,
  OSA_FIRST_CONTACT_OPENING_LINES,
  OSA_FIRST_CONTACT_ORBIT_LINES,
  OSA_FIRST_CONTACT_SEEN_KEY,
  OSA_SONIC_LOGO_AUDIO,
} from '@/utils/first-contact/osa-first-contact';

describe('OSA first contact', () => {
  it('defines opening lines in order', () => {
    assert.equal(OSA_FIRST_CONTACT_OPENING_LINES.length, 2);
    assert.match(OSA_FIRST_CONTACT_OPENING_LINES[0] ?? '', /новый сервис/);
    assert.match(OSA_FIRST_CONTACT_OPENING_LINES[1] ?? '', /всё изменит/);
  });

  it('defines orbit and closing copy', () => {
    assert.equal(OSA_FIRST_CONTACT_ORBIT_LINES.length, 2);
    assert.match(OSA_FIRST_CONTACT_ORBIT_LINES[0] ?? '', /никогда не была в сервисах/);
    assert.match(OSA_FIRST_CONTACT_ORBIT_LINES[1] ?? '', /не хватало системы/);
    assert.match(OSA_FIRST_CONTACT_CLOSING_TAGLINE, /Теперь мы работаем вместе/);
  });

  it('uses localStorage key osa_first_contact_seen', () => {
    assert.equal(OSA_FIRST_CONTACT_SEEN_KEY, 'osa_first_contact_seen');
    assert.equal(hasSeenOsaFirstContact(), false);
    markOsaFirstContactSeen();
    assert.equal(hasSeenOsaFirstContact(), false);
  });

  it('points sonic logo to public audio asset', () => {
    assert.equal(OSA_SONIC_LOGO_AUDIO, '/assets/audio/sonic-logo.mp3');
  });
});
