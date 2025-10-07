import React from 'react';

export default function DataTypes() {
  return (
    <div className="p-6 md:p-10 bg-slate-500" style={{color: 'white'}}>
      <h1>Corny Chat Data Types</h1>

      <p className="text-lg">
        This page describes the nostr kind data types used within the
        application, along with hook points, so that developers wanting to make
        improvements to the application, or make use of Corny Chat related nostr
        events have a central point of guidance. Corny Chat provides audio
        spaces, a.k.a. rooms, for which users can have voice conversations and
        share resources with each other.
      </p>

      <ul style={{listStyleType: 'circle', margin: '20px'}}>
        <li>
          <a href="#kind0userprofile">Kind 0 - User Profile</a>
        </li>
        <li>
          <a href="#kind0roomprofile">Kind 0 - Room Profile</a>
        </li>
        <li>
          <a href="#kind1extensionlogin">Kind 1 - Extension Login</a>
        </li>
        <li>
          <a href="#kind1verficiation">Kind 1 - Verification Post</a>
        </li>
        <li>
          <a href="#kind1userpost">Kind 1 - User Post</a>
        </li>
        <li>
          <a href="#kind1scheduledevent">Kind 1 - Scheduled Event</a>
        </li>
        <li>
          <a href="#kind3follow">Kind 3 - Follow List</a>
        </li>
        <li>
          <a href="#kind5eventdeletion">Kind 5 - Event Deletions</a>
        </li>
        <li>
          <a href="#kind8badgeawards">Kind 8 - Badge Awards</a>
        </li>
        <li>
          <a href="#kind1311livetext">Kind 1311 - Live Text</a>
        </li>
        <li>
          <a href="#kind9041zapgoal">Kind 9041 - Zap Goal</a>
        </li>
        <li>
          <a href="#kind9734zaprequest">Kind 9734 - Zap Request</a>
        </li>
        <li>
          <a href="#kind9735zapreceipt">Kind 9735 - Zap Receipt</a>
        </li>
        <li>
          <a href="#kind10002relaylist">Kind 10002 - Relay List Metadata</a>
        </li>
        <li>
          <a href="#kind10030useremojilist">Kind 10030 - User Emoji List</a>
        </li>
        <li>
          <a href="#kind23194nip47request">
            Kind 23194 - Nostr Wallet Connect Request
          </a>
        </li>
        <li>
          <a href="#kind23195nip47response">
            Kind 23195 - Nostr Wallet Connect Response
          </a>
        </li>
        <li>
          <a href="#kind27235httpauth">Kind 27235 - HTTP Auth</a>
        </li>
        <li>
          <a href="#kind30000followset">Kind 30000 - Follow Set</a>
        </li>
        <li>
          <a href="#kind30030emojisets">Kind 30030 - Emoji Sets</a>
        </li>
        <li>
          <a href="#kind30311liveactivities">Kind 30311 - Live Activities</a>
        </li>
        <li>
          <a href="#kind30315livestatus">Kind 30315 - Live Statuses</a>
        </li>
        <li>
          <a href="#kind30382relationships">Kind 30382 - Relationships</a>
        </li>
        <li>
          <a href="#kind30388slideset">Kind 30388 - Slide Set</a>
        </li>
        <li>
          <a href="#kind31388linkset">Kind 31388 - Link Set</a>
        </li>
        <li>
          <a href="#kind31923scheduledevent">Kind 31923 - Scheduled Event</a>
        </li>
        <li>
          <a href="#kind31989recommendationevent">
            Kind 31989 - Recommendation Event
          </a>
        </li>
        <li>
          <a href="#kind31990handlerinformation">
            Kind 31990 - Handler Information
          </a>
        </li>
        <li>
          <a href="#kind32388roomfavorites">Kind 32388 - Room Favorites</a>
        </li>
        <li>
          <a href="#kind33388highscores">Kind 33388 - High Scores</a>
        </li>
      </ul>

      <h2>Supported NIPS</h2>

      <ul style={{listStyleType: 'circle', margin: '20px'}}>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/01.md">
            NIP-01 - Basic Protocol Flow Description
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/02.md">
            NIP-02 - Follow List
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/05.md">
            NIP-05 - Mapping Nostr Keys to DNS-based internet identifiers
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/07.md">
            NIP-07 - window.nostr capability for web browsers
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/09.md">
            NIP-09 - Event Deletion Request
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/19.md">
            NIP-19 - bech32-encoded entities
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/21.md">
            NIP-21 - notsr: URI scheme
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/24.md">
            NIP-24 - Extra metadata fields and tags
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/30.md">
            NIP-30 - Custom Emoji
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/32.md">
            NIP-32 - Labeling
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/33.md">
            NIP-33 - Parameterized Replaceable Events
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/38.md">
            NIP-38 - User statuses
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/40.md">
            NIP-40 - Expiration Timestamp
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/47.md">
            NIP-47 - Nostr Wallet Connect
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/51.md">
            NIP-51 - Lists
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/52.md">
            NIP-52 - Calendar Events
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/53.md">
            NIP-53 - Live Activities
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/57.md">
            NIP-57 - Lightning Zaps
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/58.md">
            NIP-58 - Badges
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/65.md">
            NIP-65 - Relay List Metadata
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/75.md">
            NIP-75 - Zap Goals
          </a>
        </li>
        <li>
          <a href="https://github.com/vitorpamplona/nips/blob/relationship-status/81.md">
            NIP-81 - Relationship Status
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/89.md">
            NIP-89 - Recommended Application Handlers
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/96.md">
            NIP-96 - HTTP File Storage Integration
          </a>
        </li>
        <li>
          <a href="https://github.com/nostr-protocol/nips/blob/master/98.md">
            NIP-98 - HTTP Auth
          </a>
        </li>
      </ul>

      <a name="kind0userprofile"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 0 - User Profile</h2>
      <p>
        Within the application, a user is anonymous by default. They may choose
        to <a href="#kind1extensionlogin">sign in</a> with a{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/07.md">
          NIP-07
        </a>{' '}
        compliant nostr extension, or provide verification using a{' '}
        <a href="#kind1verification">kind 1</a> event. If the user identifies
        with nostr, then their corresponding user profile may be read from a
        kind 0 event authored by their pubkey. The following fields are read
        from the user metadata and displayed on the profile page:
      </p>
      <ul style={{listStyleType: 'circle', margin: '20px'}}>
        <li>name</li>
        <li>picture</li>
        <li>about</li>
        <li>nip05</li>
        <li>lud16</li>
        <li>lud06</li>
        <li>banner</li>
      </ul>
      <p>
        Per{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/30.md">
          NIP-30
        </a>
        , emojis are supported in the name and about fields.
      </p>
      <a name="kind0roomprofile"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 0 - Room Profile</h2>
      <p>
        Each room within Corny Chat can support a nostr profile. When a room
        owner sets the topic for the room, its room description, the logo for
        the room, the background image or the lightning address, these are
        mapped to metadata settings for a nostr profile and published with a
        generated nsec for the room maintained by the server. The mappings for
        these fields are as follows:
      </p>
      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
        }}
      >
        <tr
          style={{
            borderCollapse: 'collapse',
            border: '1px solid #FF0000',
            backgroundColor: '#0000C0',
          }}
        >
          <td>Room Setting Field</td>
          <td>Nostr Profile Field</td>
        </tr>
        <tr style={{borderCollapse: 'collapse', border: '1px solid #FF0000'}}>
          <td>Room Topic (name)</td>
          <td>name</td>
        </tr>
        <tr style={{borderCollapse: 'collapse', border: '1px solid #FF0000'}}>
          <td>Room Description (description)</td>
          <td>about</td>
        </tr>
        <tr style={{borderCollapse: 'collapse', border: '1px solid #FF0000'}}>
          <td>Room logo URI (logoURI)</td>
          <td>picture</td>
        </tr>
        <tr style={{borderCollapse: 'collapse', border: '1px solid #FF0000'}}>
          <td>Background Image URI (backgroundURI)</td>
          <td>banner</td>
        </tr>
        <tr style={{borderCollapse: 'collapse', border: '1px solid #FF0000'}}>
          <td>Lightning Address (lud16)</td>
          <td>lud16</td>
        </tr>
      </table>
      <p>
        When a room's profile is saved, it is automatically assigned the nip05
        field based on a concatenation of the room id, hyphenated to the string
        `room` at the host under which the service is running. For example, the
        room `mainchat` has a nip05 of mainchat-room@{location.hostname}. For
        more information, see{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/05.md">
          NIP-05
        </a>
        .
      </p>

      <a name="kind1extensionlogin"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Extension Login</h2>
      <p>
        When a user logs in with their extension, they will sign a kind 1 event
        with the content field set to the public key generated for Corny Chat by
        the software. This is a completely different public key from the nostr
        public key. Once the event is signed, it is parsed from fields saved in
        local storage in the browser profile as well as published to the Corny
        Chat server to support identity lookups and peer verification. These
        server publications are also signed by the local client with a key pair
        independent of the nostr keys and is validated on the server. The
        details on this process are not important for nostr and originate from
        the Jam codebase.
      </p>

      <a name="kind1verification"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Verification Post</h2>
      <p>
        If a user does not have a nostr extension installed, they may still
        associate their nostr account with their local Corny Chat identity
        manually. To do so, a user can click on their avatar while in a room or
        the entry screen for a room and choose edit personal settings. Their
        npub should be provided in a field, and their Corny Chat identity should
        be included in the content of a plain kind 1 post without tags on nostr.
        Once posted, the nostr event should be provided in personal settings and
        submitted for verification. If found on relays and successfully
        valiated, it will be included in their local storage and published to
        the Corny Chat server for identity lookups and peer verification. These
        server publications are also signed by the local client with a key pair
        independent of the nostr keys and is validated on the server.
      </p>

      <a name="kind1userpost"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - User Post</h2>
      <p>
        When a user views the profile of a room particpant, recent posts
        authored by that participant are loaded and displayed if the participant
        is a nostr user. This is from the kind 1 posts that are made. By
        default, up to 3 of these kinds of posts will be displayed, after having
        been fetched from the relays associated with that user's relay list
        metadata. URLs inline that are detected as images are rendered as such.
        If emoji shortcodes are present, they are converted to images per{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/30.md">
          NIP-30
        </a>
        .
      </p>
      <p>
        The ability to post a note is also supported by choosing 'Note to Nostr'
        from the menu. The input interface will parse out and prepare tags from
        included hashtags, npub, nevent, and note references.
      </p>

      <a name="kind1scheduledevent"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Scheduled Event</h2>
      <p>
        When a room owner or moderator schedules an event for the room, it is
        published as a{' '}
        <a href="#kind31923scheduledevent">Time-Based Calendar Event</a>. As not
        all users are aware of calendar applications, a kind 1 note is posted
        under the room's nostr identity for convenience. The content of this
        note simply informs when the next event is, topic and summary along with
        a link to the room.
      </p>

      <a name="kind3follow"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 3 - Follow List</h2>
      <p>
        Kind 3 is deprecated and no longer supported by Corny Chat. The
        application has upgraded to
        <a href="#kind30000followset">Kind 30000 - Follow Set</a>
      </p>

      <a name="kind5eventdeletion"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 5 - Event Deletions</h2>
      <p>
        If a room owner or moderator creates a scheduled event for a room, it
        will be published as a nostr Time Based Calendar Event. If that event is
        later deleted, then the server will publish a kind 5 deletion event for
        the referenced <a href="#kind31923scheduledevent">schedule event</a>
        for{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/09.md">
          NIP-09
        </a>{' '}
        semantics. Specifically, these events are published by the server NSEC,
        and deleted by providing an `a` tag as the composite of the kind, server
        pubkey and the `d` tag of the event. The d tag is deterministic based on
        the room identifier.
      </p>

      <a name="kind8badgeawards"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 8 - Badge Awards</h2>
      <p>
        When viewing another user's profile, if they are a nostr user, then a
        list of Corny Chat badges that have been awarded to that user will be
        retrieved following{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/58.md">
          NIP-58
        </a>
        . For each badge awarded, an image is depicted of the badge.
      </p>

      <a name="kind1311livetext"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 1311 - Live Text</h2>
      <p>
        When <a href="#kind30311liveactivities">live activites</a> are announced
        for a room, a corresponding live text message will be published by the
        room to give guidance to users on how to participate in the audio room.
        Users of Corny Chat that have nostr accounts can also publish their text
        chat messages as live text to the activity if they enable it in their
        personal settings.
      </p>

      <a name="kind9041zapgoal"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 9041 - Zap Goal</h2>
      <p>
        Zap goals can be created by room owners as a form of public fund raiser
        within the room. Within room settings, owners can create a new zap goal,
        or attach an existing one they have created previously. Zap goals are
        based on the specification outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/75.md">
          NIP-75
        </a>
        . Zap goals are also automatically created by the server for each month
        as a way to solicit help funding general infrastructure costs for
        service operation.
      </p>

      <a name="kind9734zaprequest"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 9734 - Zap Request</h2>
      <p>
        Within the application, users can zap or initiate lightning payments by
        clicking on another room participant's avatar, or clicking the Tip
        button for a room that has it enabled. Users may zap other users if they
        have a nostr extension enabled. If they don't have a nostr extension,
        then they can only send a direct lightning payment with an optional
        comment. In either case, an invoice is requested following{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/57.md">
          NIP-57
        </a>{' '}
        for nostr, which relies on relevant{' '}
        <a href="https://github.com/lnurl/luds/">LNURL LUD specifications</a>(
        <a href="https://github.com/lnurl/luds/blob/luds/06.md">06</a>,
        <a href="https://github.com/lnurl/luds/blob/luds/12.md"> 12</a>,
        <a href="https://github.com/lnurl/luds/blob/luds/16.md"> 16</a>). In the
        case of a creation of a zap, the protocol flow builds a kind 9734 zap
        request, signs it, and passes it to the custodial lightning callback
        endpoint for the payee.
      </p>

      <a name="kind9735zapreceipt"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 9735 - Zap Receipt</h2>
      <p>
        Zap receipts are monitored in rooms whenever a zap goal has been
        configured. They are expected to conform to the structure outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/57.md">
          NIP-57
        </a>
        . Specifically, they reference an event id (e.g. the zap goal), and have
        a tag for `description` that is stringified JSON. The JSON object should
        contain fields for the amount that was zapped, along with additional
        parameters. Periodically, these zap receipts are requested from relays,
        parsed, and the total zapped towards the goal is then reflected in the
        progress bar.
      </p>

      <a name="kind10002relaylist"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>
        Kind 10002 - Relay List Metadata
      </h2>
      <p>
        When retrieving nostr events about other users, such as their profile,
        or postings, the app will attempt to fetch the relays that those users
        write to, as identified by their Relay List Metadata. Relay information
        is cached in an effort to avoid constantly making the same queries too
        frequently. This follows the guidance outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/65.md">
          NIP-65
        </a>{' '}
        and described elsewhere as the inbox / outbox model.
      </p>

      <a name="kind10030useremojilist"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 10030 - User Emoji List</h2>
      <p>
        When a user logs into a room, if their current session doesn't have a
        cache of custom emojis yet, it will be built up based on the emoji sets
        (kind 30030) referenced in their User Emoji List. This allows users to
        select from these emojis when setting their sticky emojis in personal
        settings, or adding room reactions via room settings. This follows the
        structure outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/51.md">
          NIP-51
        </a>
        .
      </p>

      <a name="kind23194nip47request"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>
        Kind 23194 - Nostr Wallet Connect Request
      </h2>
      <p>
        When setting up a zap request, if nostr wallet connect is enabled in the
        user's personal settings, then a request to pay an invoice will be made
        using the connection url. This follows the guidance outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/47.md">
          NIP-47
        </a>{' '}
        using the getalby sdk.
      </p>

      <a name="kind23195nip47response"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>
        Kind 23195 - Nostr Wallet Connect Response
      </h2>
      <p>
        If nostr wallet connect is enabled and a payment request is made, then
        the response is processed following the guidance outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/47.md">
          NIP-47
        </a>{' '}
        using the getalby sdk.
      </p>

      <a name="kind27235httpauth"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 27235 - HTTP Auth</h2>
      <p>
        HTTP Auth events are prepared following guidance outlined in
        <a href="https://github.com/nostr-protocol/nips/blob/master/98.md">
          NIP-98
        </a>{' '}
        when uploading files to media servers as part of{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/96.md">
          NIP-96
        </a>{' '}
        HTTP File Storage Integration. Some media servers impose limitations on
        users that do not authenticate, and this is a means to identify
        ownership of the file and benefit from services the user is subscribed
        to.
      </p>

      <a name="kind30000followset"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30000 - Follow Set</h2>
      <h3>Follow Set Lists</h3>
      <p>
        If a user has a nostr extension, they will be presented with options
        allow them to Edit their lists when viewing their profile page. This is
        restricted to kind 30000 follow sets, and allows for creating and
        modifying existing lists, permitting to addition and removal of npub
        values. These lists can in turn be used to restrict access to a room to
        only those that are present in the list.
      </p>
      <h3>Corny Chat Follows Contact List</h3>
      <p>
        If a user has a nostr extension, they will also be presented with
        options to Add or Remove a participant to/from their Contact List when
        viewing their profile. A user can view another's profile by clicking on
        their avatar image while in a Corny Chat audio room. For the first time
        during the browsing session, the client will fetch the contact list and
        check if the user whose profile they are viewing is on it. The current
        contact list is stored in session storage and updated based on
        Add/Remove actions performed. When a change is made to who a user has on
        their list through the app, it will publish an updated contact list as
        kind 30000 as defined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/51.md">
          NIP-51
        </a>
        . The following tags are set
      </p>

      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "cornychat-follows"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["name", "Corny Chat Follows"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["title", "Corny Chat Follows"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["p", "pubkey of user included in list"], // repeated</td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>

      <a name="kind30030emojisets"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30030 - Emoji Sets</h2>
      <p>
        Emoji Sets contain a list of short code references for emojis and their
        corresponding image urls. When a user logs into a room, if their current
        session doesn't have a cache of custom emojis yet, it will be built up
        based on the emoji sets referenced in their User Emoji List (kind
        10030). This allows users to select from these emojis when setting their
        sticky emojis in personal settings, or adding room reactions via room
        settings. This follows the structure outlined in{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/51.md">
          NIP-51
        </a>
        .
      </p>

      <a name="kind30311liveactivities"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30311 - Live Activities</h2>
      <p>
        Room owners can denote a room setting to announce the room as a live
        activity. At this time, this only publishes the key state of the room,
        including the current slideshow image or room logo url, the room's
        title, description, and room participants. A combined audio feed may be
        made available for streaming externally at a later date.
      </p>
      <p>
        Corny Chat promotes integration with other like kind applications. Corny
        Chat is a live audio space, and lists active rooms on its landing page.
        In an effort to promote greater discovery through the Nostr universe,
        Corny Chat also seeks to list live activities published to nostr that
        are presumably still active. To do this, the list of scheduled events is
        periodically updated, and includes those of kind 30311 that meet the
        following requirements:
      </p>
      <ul style={{listStyleType: 'circle', margin: '20px'}}>
        <li>
          The live activity must have a `d` tag and not be marked as deleted (
          per{' '}
          <a href="https://github.com/nostr-protocol/nips/blob/master/09.md">
            NIP-09
          </a>{' '}
          kind 5 or with `deleted` tag)
        </li>
        <li>
          The live activity must have a `title` tag with a value that isn't an
          empty string
        </li>
        <li>
          It must have started, or start within the next week as defined by a
          required `starts` tag.
        </li>
        <li>
          If it has started, it must not have ended more than an hour ago as
          defined by an optional `ends` tag.
        </li>
        <li>
          If the live activity does not include an end time, it is assumed to
          have ended an hour after the current timestamp
        </li>
        <li>The live activity must have a `service` tag.</li>
        <li>
          The live activity must have a `streaming` tag with the endpoint to
          link to, or be associated with the services `zap.stream` or
          `nostrnests.com` from which the location will be calculated based on
          the `d` tag and a known set of relays for the service.
        </li>
        <li>
          An optional `image` tag will be used in square format to represent the
          activity. If not provided, it will default to the service concatenated
          with favicon.png
        </li>
      </ul>

      <a name="kind30315livestatuses"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30315 - Live Statuses</h2>
      <p>
        Users can optionally choose to automatically publish status updates once
        an hour of the room(s) they are in. These conform to{' '}
        <a href="https://github.com/nostr-protocol/nips/blob/master/38.md">
          NIP-38
        </a>{' '}
        and the update indicates that the user is chatting in the room specified
        by URL, are set to expire one hour after creation, and use the `music`
        value for the d tag.
      </p>

      <a name="kind30382relationships"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30382 - Relationships</h2>
      <p>
        Relationships are defind in{' '}
        <a href="https://github.com/vitorpamplona/nips/blob/relationship-status/81.md">
          NIP-81
        </a>{' '}
        as replaceable event using kind 30382. Corny Chat uses these
        relationships to allow users to set petnames/nicknames for users based
        on their nostr pubkey. Any petnames defined, either in cleartext tags,
        or via nip44 encrypted content tags will be used as aliases in place of
        the target account name when viewing room avatars, chat avatars,
        profile, and user lists within room settings. A petname can be set by
        viewing a user's profile, and clicking on the name for edit
        functionality. At this time, the ability to clear/delete a petname is
        not provided.
      </p>

      <a name="kind30388slideset"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 30388 - Slide Sets</h2>
      <p>
        A slide set is a collection of URLs that represent images that can be
        displayed within a Corny Chat room. Owners and moderators with a nostr
        extension can export and import slide sets from room settings. As a
        replaceable event, a `d` tag is required to be set, and is defaulted by
        the application based on a concatenation of the string `cornychat`, the
        room identifier, and the date and time in ISO format. Reusing the same
        value allows for replacing a prior published event when doing an export.
        The expected tags for import, which are set automatically during export,
        are as follows:
      </p>

      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "the-d-tag"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["name", "User provided name of the slide set"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["about", "User provided description of the slide set"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["image", "URI selectable from user of an image in the slide set"],
          </td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["L", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["l", "Corny Chat Slide Set", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["r", "URI of image", "optional caption of image"], // repeated
          </td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>

      <p>
        Other applications may make Slide Sets or use the same kind 30388 as
        well. But they will not show in the list of slide sets to import unless
        they include the referenced label namespace and label value. Slide sets
        will also be excluded if using the `expiration` tag and such timestamp
        has passed.
      </p>

      <a name="kind31388linkset"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 31388 - Link Sets</h2>
      <p>
        A link set is a collection of URLs that represent captioned hyperlinks
        or groupings of links which can be displayed within the links resources
        area of a Corny Chat room. Owners and moderators with a nostr extension
        can export and import link sets from room settings. As a replaceable
        event, a `d` tag is required to be set, and is defaulted by the
        application based on a concatenation of the string `cornychat`, the room
        identifier, and the date and time in ISO format. Reusing the same value
        allows for replacing a prior published event when doing an export. The
        expected tags for import, which are set automatically during export are
        as follows:
      </p>
      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "the-d-tag"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["name", "User provided name of the link set"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["about", "User provided description of the link set"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["image", "URI of an image denoting it is a link set"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["L", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["l", "Corny Chat Link Set", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["r", "optional URI of link", "optional caption for link or group
            without a link"], // repeated
          </td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>

      <p>
        The order of `r` tags is set by users of the application and this order
        should be maintained only changed within an interface allowing the user
        to reorder. Other applications may make Link Sets or use the same kind
        31388 as well. But they will not show in the list of link sets to import
        unless they include the referenced label namespace and label value. Link
        sets will also be excluded if using the `expiration` tag and such
        timestamp has passed.
      </p>

      <a name="kind31923scheduledevent"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 31923 - Scheduled Event</h2>
      <p>
        A room owner or moderator can create and delete scheduled events for a
        room. These allow setting the topic of the event and description, and
        are defaulted to the rooms current settings for each. As this is a
        specific time based event in the future, it is also published as
        Time-Based Calendar Event kind 31923. The tags saved in the event are as
        follows for maximum compatibility with viewing clients such as Flockstr
        and Coracle Social:
      </p>
      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "the-d-tag"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["title", "the title of the scheduled event"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["name", "the title of the scheduled event"], // deprecated, but
            Flockstr depends on
          </td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["start", "normalized to unix time"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["end", "normalized to unix time"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["start_tzid", "Europe/London"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["end_tzid", "Europe/London"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["location", "https://cornychat.com/roomid"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["summary", "the description of the event"], // replaces deprecated
            Flockstr tag: about
          </td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["image", "the rooms URI"], // Undocumented Flockstr tag</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["L", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["l", "cornychat.com", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["l", "audiospace", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["r", "https://cornychat.com/roomId"], // url to the room</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["p", "pubkey of user that scheduled", "", "host"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["p", "pubkey of room moderator", "", "moderator"], // repeated
          </td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>
      <p>
        The `d` tag is calculated based on the room identifier and is reused for
        all scheduled events for the room. Some deprecated tags are included as
        some commonly used applications still expect them to exist by the
        deprecated name.
      </p>
      <p>
        If the scheduled event is deleted by a room owner or a moderator, it
        will be published with empty information before the corresponding{' '}
        <a href="#kind5eventdeletion">event deletion</a>. This helps ensure its
        removal as there is inconsistency in the nostr network relays for
        handling deletion requests.
      </p>
      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "the-d-tag"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["L", "com.cornychat"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["l", "deleted"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["expiration", "1712121300"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["title", "Deleted Event"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["start", "0"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["end", "0"],</td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>

      <a name="kind31989recommendationevent"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>
        Kind 31989 - Recommendation Event
      </h2>
      <p>
        A user can recommend the application for handling supported event kinds.
      </p>

      <a name="kind31990handlerinformation"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>
        Kind 31990 - Handler Information
      </h2>
      <p>The service announces kinds it can handle to nostr relays.</p>

      <p>
        <a href="/" style={{textDecoration: 'underline'}}>
          Home
        </a>
      </p>

      <a name="kind32388roomfavorites"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 32388 - Room Favorites</h2>
      <p>
        Room Favorites track those rooms for which a user has marked as a
        favorite. Favorited rooms appear with star backgrouns on the My Rooms
        tab to draw attention to them. As a replaceable event, a `d` tag is
        assigned with a consistent value. The expected tags for this structure
        are as follows:
      </p>

      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "cornychat-room-favorites"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["name", "Corny Chat Room Favorites"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["r", "roomId", "URI of the room"], // repeated</td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>

      <a name="kind33388highscores"></a>
      <h2 style={{backgroundColor: '#ff0000'}}>Kind 33388 - High Scores</h2>
      <p>
        High Scores track the current scores for pubkeys for each week. Users
        can increase their score by completing various actions. As a replaceable
        event, a `d` tag is assigned with a consistent value. The expected tags
        for this structure are as follows:
      </p>

      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #FF0000',
          margin: '20px',
          fontFamily: 'courier',
          fontSize: '.8em',
        }}
      >
        <tr>
          <td colspan="2">tags: [</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>["d", "cornychat-highscore-2025w23"],</td>
        </tr>
        <tr>
          <td style={{width: '50px'}}></td>
          <td>
            ["p", "pubkey", "score"], // repe
            <span
              onClick={() =>
                localStorage.setItem(
                  'iAmAdmin',
                  String(
                    !((localStorage.getItem('iAmAdmin') ?? 'false') == 'true')
                  )
                )
              }
            >
              a
            </span>
            ted
          </td>
        </tr>
        <tr>
          <td colspan="2">]</td>
        </tr>
      </table>
    </div>
  );
}
