# Event Storm Note Taker

Listens to a remote Event Storming conversation and draws the board as the conversation happens, so the participants can just talk.

## Language

**Session**:
One Event Storming conversation from start to finish, whether a group's or one Domain Expert talking it through.
_Avoid_: Meeting, call, workshop (when meaning the recorded unit)

**Domain Expert**:
A person who knows the domain being explored and talks it through in a Session.
_Avoid_: User, speaker, participant (when meaning the person with the knowledge)

**Recording**:
The kept audio of one Session, with the moments each Phase began.
_Avoid_: Audio, file, tape

**Run**:
One pass of the Scribe over a Session's conversation, producing one Board. The live Session is its first Run; each later Run re-uses the Recording.
_Avoid_: Replay, attempt, execution

**Board**:
The digital infinite canvas holding everything the Scribe and people drew during one Run.
_Avoid_: Wall, canvas, Miro

**Big Picture**:
The Event Storming level that explores a whole domain through its events, without design detail. The only level supported so far.
_Avoid_: Overview, high level

**Scribe**:
The invisible listener that turns the conversation into Stickies on the Board, so no participant has to write anything.
_Avoid_: Bot, agent, assistant, AI

**Scope**:
What the Session's domain covers and what it leaves out, agreed during Kick Off.

**Goal**:
What the Session is meant to achieve, agreed during Kick Off.

## Stickies

**Sticky**:
One item on the Board, of a single Sticky kind. The Scribe may revise or remove the Stickies it placed, until a human edits one; from then on that Sticky is the human's.
_Avoid_: Card, note, element, node

**Sticky kind**:
What a Sticky represents, traditionally shown by its colour.
_Avoid_: Type, colour, category

**Domain Event**:
A Sticky kind for something that happened in the domain that a domain expert cares about, named in the past tense ("Order Placed").
_Avoid_: Event (alone), action, step

**Hot Spot**:
A Sticky kind marking a question, disagreement, risk or problem raised in the conversation.
_Avoid_: Issue, problem, question (alone)

**Pivotal Event**:
A Domain Event marked as a boundary between parts of the timeline, where the domain moves from one stage to the next.
_Avoid_: Milestone, key event

**Mention**:
One occasion in the conversation where something already on the Board is said again. A Sticky counts its Mentions instead of being repeated.
_Avoid_: Duplicate, occurrence

## Phases

**Phase**:
One stage of a Big Picture Session, each with its own goal and its own view of the Board.
_Avoid_: Step, stage, round

**Kick Off**:
The opening Phase, where the Session's scope and goal are set.

**Chaotic Exploration**:
The Phase where participants call out domain events freely, in any order, with no attempt to agree or arrange them.
_Avoid_: Brainstorm

**Enforce the Timeline**:
The Phase where the events from Chaotic Exploration are put into the order they happen in the domain, and duplicates and gaps are resolved.
_Avoid_: Sorting, ordering
