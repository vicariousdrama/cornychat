# Nostr Live Audio Spaces: Jam Edition

This software provides an open source audio space for users of Nostr.  

Users can quickly login with existing Nostr accounts and have name and avatar image set from profile data used throughout Nostr.

Roadmap

- ☑️ Login Enhancements
  - ✅ Anon login and Nostr Pubkey verification
  - ✅ Nostr Login with NIP-07 extension
  - ✅ Nostr Login with user provided NSEC
  - ⬜ Nostr Login with newly generated NSEC for onboarding (NIP-06 generate from seed words)
- ☑️ Recognition of User Profile (kind 0)
  - ✅ Fetch and display Name (kind 0)
  - ✅ Fetch and display Avatar Image from picture (kind 0)
  - ✅ Fetch and display Lightning Address (kind 0)
  - ⬜ Nostr Address (kind 0)
  - ⬜ Description/About (kind 0)
- ☑️ Room Customizations
  - ✅ Set Room Background Picture
  - ✅ Set Room Colors from Preconfigured Palette/Theme
  - ⬜ Set Room Colors from Custom Selection
  - ⬜ Set Room Emoji Reactions vs Default
  - ✅ Allow multiple avatars per row to fit on desktop
  - ⬜ Add Collapse/Expand to hide/show the room description
  - ⬜ Room Arrangement of Avatars (Stage/Audience, Alphasort, other groupings...?)
- ⬜ User Avatar / Card View Customizations
  - ⬜ Drag and Drop position of Avatars in room
  - ⬜ Resize / Zoom avatars
  - ⬜ Allow Users to set their in room status (e.g. AFK, BRB, Present)
  - ⬜ Raise Hand as Audience member and Speaker
  - ⬜ Show microphone on/muted for speakers
  - ⬜ Show indication when speaker is speaking
- ⬜ Profile Details View
  - ⬜ Edit Personal Profile to set name, picture, about, lud16, nip05
  - ⬜ Follow Button to add to contact list (kind 3)
  - ⬜ Unfollow Button to remove from contact list (kind 3)
- ⬜ View User Profile
  - ⬜ Display name, about, avatar, nostr address on popup
  - ⬜ Verify nostr address
  - ⬜ Follow User Action
  - ⬜ Unfollow User Action
- ☑️ Reaction Customizations
  - ✅ Update Default Emoji Reactions
  - ⬜ Target user for sending reaction
  - ⬜ Animate reaction from sender to target
- ☑️ Zapping other Users
  - ✅ Prepare Zap based Invoice
  - ✅ Allow Alby Browser Extension to Pay Invoice
  - ⬜ Confirm Zap paid (kind 9735)
  - ⬜ Animate Zap from payer to receiver
  - ⬜ Zap Default to target without confirmation (e.g. using Alby budget)
- ⬜ Nostr Activity + Chat
  - ⬜ Create and Publish Nostr Live Activity for Rooms (kind 30311 per NIP-53)
  - ⬜ Live Chat Message tied to the Live Activity (kind 1311)
  - ⬜ Live Chat Message language translations
  - ⬜ Save/Export chat history
  - ⬜ Ability for user to react to chat message
  - ⬜ Ability for user to zap a chat message
- ⬜ Landing Page
  - ⬜ Update Page with name, description, guide user on Nostr
  - ⬜ Show list of all Nostr Live Activities across instances
    - ⬜ Highlight rooms on the current instance
    - ⬜ Show Icon from server favicon if live activity has no image set
  - ⬜ Server Message of the Day when user accesses first time during day
- ⬜ About Page
  - ⬜ Link to this git repository for source code
  - ⬜ List of code contributors, supporters, producers.. contact and links
  - ⬜ Contact information for server operator


## About Nostr:

NOSTR is an acronym meaning "Notes and Other Stuff Transmitted through Relays". It is an alternative and open protocol for exchanging simple structured information publicly through relays your client(s) are connected to.  With Nostr, you cannot be deplatformed, and you are not fed an algorithm by default.  You can move between clients that evolve over time. For more information, check out [Nostr.how](https://nostr.how/en/what-is-nostr)

## About Jam:

This software is built as a fork from [Jam](https://gitlab.com/jam-systems/jam.git) from [stable branch on gitlab from 2023-07-27](https://gitlab.com/jam-systems/jam/-/commit/578afaf1d34c0422c153b68f5e8eb09610872bb6). 🍓 Jam is an open source alternative to Clubhouse, Twitter Spaces and similar audio spaces. With Jam you can create audio rooms that can be used for panel discussions, jam sessions, free flowing conversations, debates, theatre plays, musicals and more. The only limit is your imagination. For more information, check out [Jam](https://gitlab.com/jam-systems/jam.git), the [Jam community on 🎧 Discord](https://discord.gg/BfakmCuXSX), [Jam on X](https://twitter.com/jam_systems), and [Jam on 😽 Product Hunt](https://www.producthunt.com/posts/jam-d17ff3cc-556c-4c17-8140-5211cb1cd81f). The original README for Jam is available [here](JAM-README.md)

## Host Your Own Server

Hosting your own Instance is easy...

Follow the [Install](INSTALL.md) guidance for setting up your server

Periodically [Update](UPDATE.md) your install with changes



