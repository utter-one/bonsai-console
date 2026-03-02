# Users

The **Users** view shows end users who have interacted with your AI assistants. Users are the people on the other side of the conversation — your customers, employees, or whoever your AI is serving.

## User List

Browse users by name or identifier. Users are scoped to the selected project.

## User Profiles

Each user has a **profile** — a set of data associated with them. Profile data can be:

- **Set by the client application** when starting a conversation (e.g., the user's name, email, or account ID).
- **Updated during conversations** via `modify_user_profile` action effects or scripts.
- **Used in prompts** via <code v-pre>{{userProfile.name}}</code>, <code v-pre>{{userProfile.email}}</code>, etc.

Profile data persists across conversations, so when a returning user connects again, the AI already knows their information.

### Built-in and Custom Fields

Projects can declare user profile custom fields in **Administration > Projects > User Profile** tab. These define the expected schema for extra data your application writes into user profiles (e.g., `tier`, `accountId`, `preferences`). Declaring the schema makes the fields available in the prompt editor's autocomplete and documents the data model for your team.

## Conversation History

From a user's detail view, you can see all the conversations they've had. This gives you a full picture of a user's interaction history with the AI.

## Tips

- **Store relevant context** in user profiles — things like name, language preference, account tier, or timezone. This makes conversations more personalized.
- **Use for continuity** — Profile data carries over between conversations, so returning users get a seamless experience.
