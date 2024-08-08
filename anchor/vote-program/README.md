# Vote Program Overview

The **[vote_program](programs/vote-program/src/lib.rs)** consists of three main instructions: initialize, upvote, and downvote. Each instruction manipulates the state of a VoteState account.

- `initialize`: initializes a new VoteState account with a score of 0 and stores the bump seed.

- `upvote`: increments the vote score and updates the last voter.

- `downvote`: decrements the vote score and updates the last voter.

## Running the Program

To build the program, use the following command:

```sh
anchor build
```

## Testing

```sh
anchor test
```
