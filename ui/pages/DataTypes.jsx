import React from 'react';

export default function DataTypes() {
  return (
    <div className="p-6 md:p-10 bg-slate-500" style={{color:'white'}}>
      <h1>Corny Chat Data Types</h1>

      <p className="text-lg">
        This page describes the nostr kind data types used within the application, along with hook points so that
        developers wanting to make improvements to the application, or make use of Corny Chat related nostr events
        have a central point of guidance.  Corny Chat provides audio spaces, aka rooms for which users can have
        voice conversations and share resources with each other.
      </p>

      <ul style={{listStyleType: 'circle', margin: '20px'}}>
      <li><a href="#kind0userprofile">Kind 0 - User Profile</a></li>
      <li><a href="#kind0roomprofile">Kind 0 - Room Profile</a></li>
      <li><a href="#kind1extensionlogin">Kind 1 - Extension Login</a></li>
      <li><a href="#kind1verficiation">Kind 1 - Verification Post</a></li>
      <li><a href="#kind1userpost">Kind 1 - User Post</a></li>
      <li><a href="#kind1scheduledevent">Kind 1 - Scheduled Event</a></li>
      <li><a href="#kind3follow">Kind 3 - Follow List</a></li>
      <li><a href="#kind5eventdeletion">Kind 5 - Event Deletions</a></li>
      <li><a href="#kind9734zaprequest">Kind 9734 - Zap Request</a></li>
      <li><a href="#kind10002relaylist">Kind 10002 - Relay List Metadata</a></li>
      <li><a href="#kind23194nip47request">Kind 23194 - Nostr Wallet Connect Request</a></li>
      <li><a href="#kind23195nip47response">Kind 23195 - Nostr Wallet Connect Response</a></li>
      <li><a href="#kind30311liveactivities">Kind 30311 - Live Activities</a></li>
      <li><a href="#kind30382relationships">Kind 30382 - Relationships</a></li>
      <li><a href="#kind30388slideset">Kind 30388 - Slide Set</a></li>
      <li><a href="#kind31388linkset">Kind 31388 - Link Set</a></li>
      <li><a href="#kind31923scheduledevent">Kind 31923 - Scheduled Event</a></li>
      </ul>
      <a name="kind0userprofile"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 0 - User Profile</h2>
      <p>
        Within the application, a user is anonymous by default. They may choose to <a href="#kind1extensionlogin">sign in</a> 
        with a <a href="https://github.com/nostr-protocol/nips/blob/master/07.md">NIP-07</a> compliant nostr extension, or 
        provide verification using a <a href="#kind1verification">kind 1</a> event.  If the user identifies with nostr, then
        their corresponding user profile may be read from a kind 0 event authored by their pubkey. The following fields are 
        read from the user metadata and displayed on the profile page:
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
      <a name="kind0roomprofile"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 0 - Room Profile</h2>
      <p>
        Each room within Corny Chat can support a nostr profile. When a room owner sets the topic for the room, its room 
        description, the logo for the room, background image or lightning address, these are mapped to metadata settings
        for a nostr profile and published with a generated nsec for the room maintained by the server. The mappings for
        these fields are as follows:
      </p>
      <table style={{borderCollapse:'collapse', border: '1px solid #FF0000', margin: '20px'}}>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000', backgroundColor: '#0000C0'}}><td>Room Setting Field</td><td>Nostr Profile Field</td></tr>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000'}}><td>Room Topic (name)</td><td>name</td></tr>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000'}}><td>Room Description (description)</td><td>about</td></tr>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000'}}><td>Room logo URI (logoURI)</td><td>picture</td></tr>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000'}}><td>Background Image URI (backgroundURI)</td><td>banner</td></tr>
        <tr style={{borderCollapse:'collapse', border: '1px solid #FF0000'}}><td>Lightning Address (lud16)</td><td>lud16</td></tr>
      </table>
      <p>
        When a room's profile is saved, it is automatically assigned the nip05 field based on a concatenation
        of the room id, hyphenated to the string `room` at the host under which the service is running. For example,
        the room `mainchat` has a nip05 of mainchat-room@{location.hostname}. For more information, see
        <a href="https://github.com/nostr-protocol/nips/blob/master/05.md">NIP-05</a>.
      </p>

      <a name="kind1extensionlogin"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Extension Login</h2>
      <p>
        When a user logs in with their extension, they will sign a kind 1 event with the content field set to the public
        key generated for Corny Chat by the software. This is a completely different public key from the nostr public key.
        Once the event is signed, it is parsed from fields saved in local storage in the browser profile as well as
        published to the Corny Chat server to support identity lookups and peer verification.  These server publications
        are also signed by the local client with a keypair independent of the nostr keys and is validated on the server.
        The details on this process are not important for nostr and originate from the Jam codebase.
      </p>

      <a name="kind1verification"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Verification Post</h2>
      <p>
        If a user does not have a nostr extension installed, they may still associate their nostr account with their
        local Corny Chat identity manually. To do so, a user can click on their avatar while in a room or the entry
        screen for a room and choose edit personal settings.  Their npub should be provided in a field, and their
        Corny Chat identity should be included in the content of a plain kind 1 post without tags on nostr. Once posted,
        the nostr event should be provided in personal settings and submitted for verification. If found on relays and
        successfully valiated, it will be included in their local storage and published to the Corny Chat server for
        identity lookups and peer verification.  These server publications are also signed by the local client with 
        a keypair independent of the nostr keys and is validated on the server.
      </p>

      <a name="kind1userpost"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - User Post</h2>
      <p>
        When the a user views the profile of a room particpant, recent posts autored by that participant are loaded
        and displayed if the participant is a nostr user.  This is from the kind 1 posts that are made.  Up to 3
        of these kinds of posts will be displayed, aftering having been fetched from the relays associated with that
        user's relay list metadata.  At this time, transformations of content beyond new paragraphs or breaking for
        line returns are not performed. For example, inline image or link urls are not rendered, nor are there any
        treatments of tags.
      </p>

      <a name="kind1scheduledevent"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 1 - Scheduled Event</h2>
      <p>
        When a room owner or moderator schedules an event for the room, it is published as a 
        <a href="#kind31923scheduledevent">Time-Based Calendar Event</a>. As not all users are aware of calendar
        applications, a kind 1 note is posted under the rooms nostr identity for convenience. The content of this
        note simply informs when the next event is, topic and summary along with link to the room.
      </p>

      <a name="kind3follow"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 3 - Follow List</h2>
      <p>
        If a user has a nostr extension, they will also be presented with options to Follow or Unfollow a participant when
        viewing the participant avatar's profile. A user can view another's profile by clicking on their avatar image while
        in a Corny Chat audio room. For the first time during the browsing session, the client will fetch the 
        contact list and check if they are following the user whose profile they are viewing.  The current contact
        list is stored in session storage and updated based on follow/unfollow actions performed.  When a change
        is made to who a user is following through the app, it will publish an updated follow list as kind 3 as
        defined in <a href="https://github.com/nostr-protocol/nips/blob/master/02.md">NIP-02</a>. Neither main relay url, 
        nor pet names are assigned when following a user.
      </p>

      <a name="kind5eventdeletion"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 5 - Event Deletions</h2>
      <p>
        If a room owner or moderator creates a scheduled event for a room, it will be published as a nostr
        Time Based Calendar Event.  If that event is later deleted, then the server will publish a kind 5 deletion
        event for the referenced <a href="#kind31923scheduledevent">schedule event</a> for 
        <a href="https://github.com/nostr-protocol/nips/blob/master/09.md">NIP-09</a> semantics. Specifically, these
        events are published by the server NSEC, and deleted by providing an `a` tag as the composite of the kind, 
        server pubkey and the `d` tag of the event.  The d tag is deterministic based on the room identifier.
      </p>

      <a name="kind9734zaprequest"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 9734 - Zap Request</h2>
      <p>
        Within the application, users can zap or initiate lightning payments by clicking on another room participants
        avatar, or clicking the Tip button for a room that has it enabled. Users may zap other users if they have 
        a nostr extension enabled. If they don't have a nostr extension, then they can only send a direct lightning
        payment with an optional comment.  In either case, an invoice is requested following 
        <a href="https://github.com/nostr-protocol/nips/blob/master/57.md">NIP-57</a> for nostr, which
        relies on relevant <a href="https://github.com/lnurl/luds/">LNURL LUD specifications</a> 
        (<a href="https://github.com/lnurl/luds/blob/luds/06.md">06</a>, 
         <a href="https://github.com/lnurl/luds/blob/luds/12.md">12</a>, 
         <a href="https://github.com/lnurl/luds/blob/luds/16.md">16</a>).  In the case of a creation of a zap, the
        protocol flow builds a kind 9734 zap request, signs it, and passes it to the custodial lightning callback 
        endpoint for the payee.
      </p>

      <a name="kind10002relaylist"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 10002 - Relay List Metadata</h2>
      <p>
        When retrieving nostr events about other users, such as their profile, or postings, the app will attempt to
        fetch the relays that those users write to, as identified by their Relay List Metadata.  Relay information
        is cached in an effort to avoid constantly making the same queries too frequently.  This follows the guidance
        outlined in <a href="https://github.com/nostr-protocol/nips/blob/master/65.md">NIP-65</a> and described 
        elsewhere as the inbox / outbox model.
      </p>

      <a name="kind23194nip47request"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 23194 - Nostr Wallet Connect Request</h2>
      <p>
        When setting up a zap request, if nostr wallet connect is enabled in the user's personal settings, then a
        request to pay an invoice will be made using the connection url. This follows the guidance outlined in
        <a href="https://github.com/nostr-protocol/nips/blob/master/47.md">NIP-47</a> using the getalby sdk.
      </p>

      <a name="kind23195nip47response"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 23195 - Nostr Wallet Connect Response</h2>
      <p>
        If nostr wallet connect is enabled and a payment request is made, then the response is processed following
        the guidance outlined in <a href="https://github.com/nostr-protocol/nips/blob/master/47.md">NIP-47</a> using the getalby sdk.
      </p>

      <a name="kind30311liveactivities"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 30311 - Live Activities</h2>
      <p>Room Owners can denote a room setting to announce the room as a live activity. At this time, this only publishes
        the key state of the room including the current slideshow image or room logo url, the room's title, description,
        and room participants. A combined audio feed may be made available for streaming externally at a later date.
      </p>
      <p>
        Corny Chat promotes integrations with other like kind applications.  Corny Chat is a live audio space, and
        lists active rooms on its landing page.  In an effort to promote greater discovery through the Nostr universe,
        Corny Chat also seeks to list live activities published to nostr that are presumably still active.  To do
        this, the list of scheduled events is periodically updated, and includes those of kind 30311 that meet the
        following requirements:
      </p>
      <ul style={{listStyleType: 'circle', margin: '20px'}}>
        <li>The live activity must have a `d` tag and not be marked as deleted (per
          <a href="https://github.com/nostr-protocol/nips/blob/master/09.md">NIP-09</a> kind 5 or with `deleted` tag)</li>
        <li>The live activity must have a `title` tag with a value that isn't an empty string</li>
        <li>It must have started, or start within the next week as defined by a required `starts` tag.</li>
        <li>If it has started, it must not have ended more than an hour ago as defined by an optional `ends` tag.</li>
        <li>If the live activity does not include an end time, it is assumed to have ended an hour after the current timestamp</li>
        <li>The live activity must have a `service` tag.</li>
        <li>The live activity must have a `streaming` tag with the endpoint to link to, or be associated with the services
            `zap.stream` or `nostrnests.com` from which the location will be calculated based on the `d` tag and a known 
            set of relays for the service.</li>
        <li>An optional `image` tag will be used in square format to represent the activity. If not provided, it will
            default to the service concatenated with favicon.png
        </li>
      </ul>

      <a name="kind30382relationships"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 30382 - Relationships</h2>
      <span style={{backgroundColor:'#ffff00',color:'#000000'}}>Experimental</span>
      <p>
        Relationships are defind in <a href="https://github.com/vitorpamplona/nips/blob/relationship-status/81.md">NIP-81</a> as
        replaceable event using kind 30382. Corny Chat uses these relationships to allow users to set petnames/nicknames for
        users based on their nostr pubkey.  Any petnames defined, either in cleartext tags, or via nip44 encrypted content
        tags will be used as aliases in place of the target account name when viewing room avatars, chat avatars, profile, and
        user lists within room settings.  A petname can be set by viewing a user's profile, and clicking on the name for edit
        functionality. At this time, the ability to clear/delete a petname is not provided.
      </p>

      <a name="kind30388slideset"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 30388 - Slide Sets</h2>
      <p>
        A slide set is a collection of URLs that represent images which can be displayed within a Corny Chat room.  Owners
        and moderators with a nostr extension can export and import slide sets from room settings.  As a replaceable event,
        a `d` tag is required to be set, and is defaulted by the application based on a concatenation of the string
        `cornychat`, the room identifier, and the date and time in ISO format.  Reusing the same value allows for replacing
        a prior published event when doing an export.  The expected tags for import, which are set automatically during
        export are as follows:
      </p>

      <table style={{borderCollapse:'collapse', border: '1px solid #FF0000', margin: '20px', fontFamily: 'courier', fontSize: '.8em'}}>
      <tr><td colspan="2">tags: [</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["d", "the-d-tag"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["name", "User provided name of the slide set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["about", "User provided description of the slide set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["image", "URI selectable from user of an image in the slide set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["L", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["l", "Corny Chat Slide Set", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["r", "URI of image", "optional caption of image"],     // repeated</td></tr>
      <tr><td colspan="2">]</td></tr>
      </table>

      <p>
        Other applications may make Slide Sets or use the same kind 30388 as well. But they will not show in the list of
        slide sets to import unless they include the referenced label namespace and label value.  Slide sets will also be
        excluded if using the `expiration` tag and such timestamp has passed.
      </p>

      <a name="kind31388linkset"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 31388 - Link Sets</h2>
      <p>
        A link set is a collection of URLs that represent captioned hyperlinks or groupings of links which can be displayed 
        within the links resources area of a Corny Chat room.  Owners and moderators with a nostr extension can export and 
        import link sets from room settings.  As a replaceable event, a `d` tag is required to be set, and is defaulted by
        the application based on a concatenation of the string `cornychat`, the room identifier, and the date and time in
        ISO format.  Reusing the same value allows for replacing a prior published event when doing an export.  The 
        expected tags for import, which are set automatically during export are as follows:
      </p>
      <table style={{borderCollapse:'collapse', border: '1px solid #FF0000', margin: '20px', fontFamily: 'courier', fontSize: '.8em'}}>
      <tr><td colspan="2">tags: [</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["d", "the-d-tag"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["name", "User provided name of the link set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["about", "User provided description of the link set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["image", "URI of an image denoting it is a link set"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["L", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["l", "Corny Chat Link Set", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["r", "optional URI of link", "optional caption for link or group without a link"],     // repeated</td></tr>
      <tr><td colspan="2">]</td></tr>
      </table>

      <p>
        The order of `r` tags is set by users of the application and this order should be maintained only changed within
        an interface allowing the user to reorder.
        Other applications may make Link Sets or use the same kind 31388 as well. But they will not show in the list of
        link sets to import unless they include the referenced label namespace and label value.  Link sets will also be
        excluded if using the `expiration` tag and such timestamp has passed.
      </p>

      <a name="kind31923scheduledevent"></a><h2 style={{backgroundColor: '#ff0000'}}>Kind 31923 - Scheduled Event</h2>
      <p>
        A room owner or moderator can create and delete scheduled events for a room.  These allow setting the topic
        of the event and description, and are defaulted to the rooms current settings for each.  As this is a specific
        time based event in the future, it is also published as Time-Based Calendar Event kind 31923.  The tags saved
        in the event are as follows for maximum compatibility with viewing clients such as Flockstr and Coracle Social:
      </p>
      <table style={{borderCollapse:'collapse', border: '1px solid #FF0000', margin: '20px', fontFamily: 'courier', fontSize: '.8em'}}>
      <tr><td colspan="2">tags: [</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["d", "the-d-tag"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["title", "the title of the scheduled event"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["name", "the title of the scheduled event"],               // deprecated, but Flockstr depends on</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["start", "normalized to unix time"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["end", "normalized to unix time"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["start_tzid", "Europe/London"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["end_tzid", "Europe/London"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["location", "https://cornychat.com/roomid"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["about", "the description of the event"],                  // Undocumented Flockstr tag</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["image", "the rooms URI"],                                 // Undocumented Flockstr tag</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["L", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["l", "cornychat.com", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["l", "audiospace", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["r", "https://cornychat.com/roomId"],                      // url to the room</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["p", "pubkey of user that scheduled", "", "host"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["p", "pubkey of room moderator", "", "moderator"],         // repeated</td></tr>
      <tr><td colspan="2">]</td></tr>
      </table>
      <p>
        The `d` tag is calculated based on the room identifier and is reused for all scheduled events for the room.
        Some deprecated tags are included as some commonly used applications still expect them to exist by the
        deprecated name.
      </p>
      <p>
        If the scheduled event is deleted by a room owner or a moderator, it will be published with empty information
        before the corresponding <a href="#kind5eventdeletion">event deletion</a>. This helps ensure its removal as
        there is inconsistency in the nostr network relays for handling deletion requests.
      </p>
      <table style={{borderCollapse:'collapse', border: '1px solid #FF0000', margin: '20px', fontFamily: 'courier', fontSize: '.8em'}}>
      <tr><td colspan="2">tags: [</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["d", "the-d-tag"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["L", "com.cornychat"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["l", "deleted"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["expiration", "1712121300"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["title", "Deleted Event"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["start", "0"],</td></tr>
      <tr><td style={{width:'50px'}}></td><td>["end", "0"],</td></tr>
      <tr><td colspan="2">]</td></tr>
      </table>

      <p><a href="/" style={{textDecoration: 'underline'}}>Home</a></p>

    </div>
  );
}
