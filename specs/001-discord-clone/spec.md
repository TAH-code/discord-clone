# Feature Specification: Discord Clone — Real-Time Chat & Video

**Feature Branch**: `001-discord-clone`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Build a real-time chat and video calling application modeled on Discord. Users sign up and log in with a display name, avatar, and visible online/offline status. Users create communities ('servers') with an owner, invite links, and a member list. Servers contain text and voice channels; every server starts with a default 'general' text channel. Members send real-time text messages with edit/delete, timestamps, typing indicators, and infinite-scroll history. Any user can open a 1-on-1 direct message with another member of a shared server. Members can join a voice channel to start or join a live voice/video call (2-4 participants) with mute/camera toggle and speaking indicators; 1-on-1 video calls can also start from a DM. Out of scope for v1: attachments, reactions, threads, granular roles/permissions, screen sharing, mobile apps, message search."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Text Messaging in a Channel (Priority: P1)

A member of a server opens a text channel and exchanges messages with other
members currently online. Messages from any member appear for everyone in
the channel immediately, without anyone needing to refresh the page.

**Why this priority**: This is the core value proposition of the product —
without real-time messaging working reliably, nothing else matters. It is
also the simplest slice that proves the real-time architecture works end to
end (write → propagate → render).

**Independent Test**: Two users, each in their own browser session, join the
same server and the same text channel. User A sends a message. User B sees
it appear within the channel without taking any action. This can be fully
tested and demonstrated with only "sign up," "create/join a server," and
"send/receive a message" — no other feature is required.

**Acceptance Scenarios**:

1. **Given** two members are viewing the same text channel, **When** one member sends a message, **Then** the message appears for the other member in real time, showing author name, avatar, timestamp, and content.
2. **Given** a member is the author of a message, **When** they edit it, **Then** the updated content and an "edited" indicator appear for all members viewing the channel.
3. **Given** a member is the author of a message, **When** they delete it, **Then** the message is removed from the channel for all members.
4. **Given** a member is composing a message, **When** they start typing, **Then** other members currently viewing the channel see a typing indicator that clears when typing stops or the message is sent.
5. **Given** a channel has more message history than fits on screen, **When** a member scrolls up, **Then** older messages load progressively (infinite scroll), newest-first.

---

### User Story 2 - Create and Join a Server (Priority: P1)

A user creates a named community ("server"), becomes its owner, and invites
others to join via a link. Joining members appear in the member list with
their online/offline status, and the server exposes a default text channel
so conversation can start immediately.

**Why this priority**: Servers are the organizing container for every other
feature (channels, messaging, calls). Without the ability to create and join
one, there is no context in which any other user story can occur.

**Independent Test**: A signed-up user creates a server and receives an
invite link. A second signed-up user opens that link and joins. The first
user sees the second user appear in the member list without refreshing.
This is testable in isolation using only "sign up" and "create/join server."

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a server (with a name and optional image), **Then** they become its owner and a default "general" text channel is created automatically.
2. **Given** a server owner, **When** they generate an invite link, **Then** any user who opens that link and is logged in can join the server as a member.
3. **Given** a member has joined a server, **When** any other member views that server's member list, **Then** the new member appears with their current online/offline status, without a page refresh.
4. **Given** a server owner, **When** they rename the server or remove a member, **Then** the change is reflected for all members without a refresh.

---

### User Story 3 - Manage Channels (Priority: P2)

A server owner organizes conversation by creating, renaming, and deleting
text and voice channels beyond the default "general" channel.

**Why this priority**: Multiple channels let a community separate topics
and voice spaces, which is expected Discord-like behavior, but a server
with only "general" is still a usable, demonstrable product — so this
builds on, rather than blocks, User Stories 1 and 2.

**Independent Test**: A server owner creates a new text channel and a new
voice channel, renames one, and deletes another. Members can see the
resulting channel list update without refreshing. Testable independently
once a server exists (Story 2).

**Acceptance Scenarios**:

1. **Given** a server owner, **When** they create a new text or voice channel, **Then** it appears in the channel list for all members.
2. **Given** a server owner, **When** they rename a channel, **Then** the new name appears for all members immediately.
3. **Given** a server owner, **When** they delete a channel, **Then** the channel and all of its messages are permanently removed for all members.
4. **Given** any member, **When** they view a server, **Then** they can see all of that server's text and voice channels (channel visibility is not restricted by role in v1).

---

### User Story 4 - Direct Messages Between Members (Priority: P2)

Any user opens a private, 1-on-1 conversation with another user they share
at least one server with, independent of any specific server's channels.

**Why this priority**: DMs extend real-time messaging (Story 1) to a private
context and are a widely expected feature, but the product is still coherent
and demonstrable without them, so they follow server/channel messaging.

**Independent Test**: Two users who are members of the same server open a
direct message conversation with each other and exchange messages, including
edit and delete, with the same real-time behavior as channel messages.
Testable independently once two users share a server (Story 2).

**Acceptance Scenarios**:

1. **Given** two users are members of at least one shared server, **When** either one opens a direct message with the other, **Then** a private conversation is created (or reopened if it already exists).
2. **Given** an open direct message conversation, **When** either participant sends a message, **Then** it appears for the other participant in real time with the same author/timestamp/content display as channel messages.
3. **Given** a direct message the user authored, **When** they edit or delete it, **Then** the change is reflected for both participants, consistent with channel message behavior.

---

### User Story 5 - Voice/Video Calls in a Voice Channel (Priority: P3)

A member joins a voice channel and enters a live audio/video call with the
other members currently connected to that same channel, with the ability to
toggle microphone and camera and see who else is present and speaking.

**Why this priority**: Voice/video is the most technically complex piece and
depends on servers, channels, and members already existing — it delivers
major additional value but is reasonably built last, after the text-based
core is solid.

**Independent Test**: Two members join the same voice channel from separate
sessions. Each sees the other as a connected participant and, once camera is
enabled, sees their video. Muting/unmuting and camera toggling by one member
is visible to the other. Testable independently once a voice channel exists
(Story 3).

**Acceptance Scenarios**:

1. **Given** a voice channel with no active call, **When** a member joins it, **Then** a call starts and the member is shown as connected to that channel in the channel list, visible to all server members.
2. **Given** a member already in a call in a voice channel, **When** another member joins the same channel, **Then** both participants can see and hear each other (at least 2 participants supported; target up to 4).
3. **Given** a participant in a call, **When** they toggle their microphone or camera, **Then** other participants see the updated mute/camera state and, for camera, either see the video feed or its absence.
4. **Given** a participant in a call, **When** they are speaking, **Then** other participants see a visual indicator that this participant is currently speaking.
5. **Given** a participant in a call, **When** they choose to leave, **Then** they are removed from the call and other participants see them disconnect; the channel list no longer shows them as connected to that channel.
6. **Given** two users with an open direct message conversation, **When** either starts a video call from that DM, **Then** a 1-on-1 call begins between just those two users.

---

### Edge Cases

- What happens when the server owner deletes a voice channel that has an active call? The call ends immediately for all current participants, and they are returned to a disconnected state.
- What happens when a member loses their network connection mid-call or mid-typing? They are treated as disconnected/offline once presence detects the drop; stale call participant records are cleaned up rather than left dangling.
- What happens when a user tries to open a DM with someone they share no server with? The action is not permitted — DMs require a shared server membership.
- What happens when the server owner removes a member who is currently in a voice call or has unread DMs? The member is removed from the server and its channels immediately; any active call participation for that member ends, but existing DM history with them is preserved.
- What happens when a 5th user attempts to join a voice channel already at the 4-participant target? The system MUST still allow the attempt to succeed on a best-effort basis, but call quality/experience beyond 4 participants is not guaranteed in v1.
- What happens when a message exceeds the maximum length? The system prevents submission and indicates the limit to the author before it is sent.
- What happens when an invite link is used by a user who is not logged in? They are prompted to sign up or log in first, then joined to the server automatically afterward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to sign up and log in, and MUST associate every account with a display name and an avatar.
- **FR-002**: System MUST show every user's online/offline status to other users who share a server with them, and MUST update that status without requiring a page refresh.
- **FR-003**: System MUST allow a logged-in user to create a server with a name and an optional image; that user becomes the server's owner.
- **FR-004**: System MUST automatically create a default text channel named "general" whenever a new server is created.
- **FR-005**: System MUST allow a server owner to generate an invite link that any logged-in user can use to join the server as a member.
- **FR-006**: System MUST display, for each server, a list of its members and each member's current online/offline status.
- **FR-007**: System MUST allow a server owner to rename the server and to remove members from it.
- **FR-008**: System MUST allow a server owner to create, rename, and delete both text channels and voice channels within their server.
- **FR-009**: System MUST permanently remove a channel's messages when that channel is deleted.
- **FR-010**: System MUST allow all members of a server to view all of that server's text and voice channels.
- **FR-011**: System MUST allow a member to send a text message in a text channel and MUST propagate that message to all members currently viewing the channel in real time, without a manual refresh.
- **FR-012**: System MUST display, for each message, the author's name and avatar, a timestamp, and the message content.
- **FR-013**: System MUST allow a message's author (and only that author) to edit or delete their own message, and MUST mark edited messages as edited.
- **FR-014**: System MUST load channel message history newest-first and MUST support loading additional older history incrementally (infinite scroll) as the member scrolls.
- **FR-015**: System MUST show other members a typing indicator while a member is composing a message in a channel they are viewing, and MUST clear it when typing stops or the message is sent.
- **FR-016**: System MUST allow any user to open a direct 1-on-1 conversation with another user, provided the two users share membership in at least one server.
- **FR-017**: System MUST apply the same real-time delivery, editing, and deletion behavior to direct messages as to channel messages.
- **FR-018**: System MUST allow a member to join a voice channel, starting a call if none is active or joining the existing one if other members are already connected.
- **FR-019**: System MUST support at least 2 simultaneous participants in a voice channel call and target support for up to 4.
- **FR-020**: System MUST allow a call participant to toggle their own microphone and camera, and MUST reflect each participant's current mute/camera state to the other participants.
- **FR-021**: System MUST indicate to other participants when a given participant is currently speaking.
- **FR-022**: System MUST display, in the channel list, which members are currently connected to each voice channel.
- **FR-023**: System MUST allow a call participant to leave a call at any time, removing them from the call and updating other participants' view accordingly.
- **FR-024**: System MUST allow a 1-on-1 video call to be started directly from an open direct message conversation.
- **FR-025**: System MUST end an active call in a voice channel if that channel is deleted, and MUST disconnect all of its current participants.
- **FR-026**: System MUST enforce a maximum message length of 2000 characters and MUST prevent submission of longer messages, informing the author of the limit.
- **FR-027**: Invite links MUST remain valid indefinitely in v1 (no expiration).
- **FR-028**: System MUST exclude, from v1, message attachments/files, message reactions, threads, granular roles/permissions beyond owner-vs-member, screen sharing, native mobile apps, and message search.

### Key Entities

- **User**: A person with an account; has a display name, an avatar, and an online/offline presence status visible to others sharing a server with them.
- **Server**: A named community with an optional image, one owner, and a collection of members and channels.
- **Server Membership**: The relationship between a user and a server they have joined, including whether that user is the server's owner.
- **Invite Link**: A shareable link tied to a server that, when used by a logged-in user, grants that user membership in the server. Does not expire in v1.
- **Channel**: A named space within a server, either a text channel (holds messages) or a voice channel (holds a live call); every server has a default "general" text channel.
- **Message**: Content authored by a member within a text channel or a direct message conversation; carries author, timestamp, content, and an edited flag; may be edited or deleted only by its author.
- **Direct Message Conversation**: A private 1-on-1 conversation between two users who share membership in at least one server; behaves like a channel for messaging purposes.
- **Typing Indicator**: A transient signal that a given member is currently composing a message in a given channel or direct message conversation.
- **Call**: A live voice/video session associated with a voice channel (or, for 1-on-1 calls, a direct message conversation), with a set of currently connected participants.
- **Call Participant**: A user's presence within a specific call, including their current microphone-muted, camera-enabled, and speaking states.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A message sent by one member appears for other members currently viewing the same channel or DM within 1 second, with no manual refresh.
- **SC-002**: A newly joined server member appears in the member list, and a newly created/renamed/deleted channel appears in the channel list, for all other members within 1 second of the change, with no manual refresh.
- **SC-003**: A change in a user's online/offline status is visible to other members sharing a server with them within 10 seconds of the underlying change (e.g., closing the app).
- **SC-004**: At least 95% of attempts by two members to establish a voice/video call in a shared voice channel succeed in showing both participants' audio/video to each other within 10 seconds of both having joined.
- **SC-005**: A member can go from "logged out" to "sending their first message in a server" in under 3 minutes, covering sign-up, server join via invite link, and message send.
- **SC-006**: A server supports at least 10 members and 10 channels without any member-list, channel-list, or messaging behavior degrading or becoming unresponsive.
- **SC-007**: A voice channel call supports at least 2 concurrent participants with functioning two-way audio/video, and up to 4 participants without the call becoming unusable.

## Assumptions

- Users have a modern web browser with a stable internet connection and, for calls, a working microphone and (optionally) camera.
- Authentication is standard email/password-style sign-up and login; no third-party SSO is required for v1.
- A single logged-in session per user is the primary use case for testing; multi-device simultaneous login is not a v1 requirement.
- "Online" means the user currently has the application open and connected; "offline" is inferred once that connection ends or times out.
- The owner-vs-member distinction is the only permission tier in v1 — there are no moderators or custom roles.
- Deleted messages, channels, and servers are permanently removed (no soft-delete/undo or recovery in v1).
- Networks with strict NAT/firewall configurations that prevent direct peer connections for calls are a known, accepted limitation of v1 and do not need to be solved by this spec.
