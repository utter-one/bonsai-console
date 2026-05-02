# Scenarios

**Scenarios** define the structure of automated conversation tests. They specify where conversations start, how many turns are allowed, when they should end, and what data to extract and validate.

## Creating a Scenario

Navigate to **Testing → Scenarios** and click **New Scenario**. The form has five tabs:

### General Tab

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | A descriptive name for the scenario (e.g., "Happy Path — Order Status"). |
| **Language** | Yes | The language of the conversation. Use the searchable selector to choose from supported locales. |
| **Description** | No | Optional notes about what this scenario tests. |
| **Tags** | No | Optional labels for organising scenarios. |

### Flow Tab

Configures how conversations in this scenario behave.

#### Starting Stage

Required. Select a [stage](../design/stages) from the project's stages to serve as the conversation entry point. The tester begins each conversation at this stage.

#### Max Turns

Optional limit on the number of conversation turns. When reached, the scenario automatically terminates that conversation. Minimum value is 1.

#### End Actions

Define [stages](../design/stages) that act as conversation terminators. When the conversation reaches any of these stages, it stops immediately. Add multiple end actions by clicking **+ Add End Action**.

#### Persona Can Hang Up

When enabled, allows the tester persona to independently decide to end the conversation based on its **Hang-Up Prompt** (configured in the [Tester](./testers) settings). Without this flag, only the max turns and end actions control termination.

#### Conversation Opener

Optional text sent by the tester as the first message when the starting stage is reached and waiting for input. If not set, defaults to `[Conversation begins.]`.

### Extraction Tab

This tab configures data extraction and validation — the core of scenario-based testing.

#### Context Transformer

Optional [context transformer](../design/context-transformers) used to post-process data extracted from the conversation. The transformer runs on extracted variables before comparison against expected values.

#### Data Extraction

Define which stage variables to extract and what values are expected. Each entry specifies:

| Column | Description |
|---|---|
| **Stage** | The stage where the variable is set (from the project's stages). |
| **Variable Name** | The variable name — auto-populated from available stage variables, or manually entered for custom names. |
| **Comparison Mode** | How to compare the actual value against the expected one. |
| **Expected Value** | The expected value (JSON or plain text). Leave blank for `exists` / `not_exists` modes. |

Available comparison modes:

| Mode | Description | Requires Value |
|---|---|---|
| **Exists** | Variable is present in the conversation state | No |
| **Not Exists** | Variable is absent from the conversation state | No |
| **Equals** | Exact string match | Yes |
| **Contains** | String contains the expected substring | Yes |
| **Includes** | Array includes the expected value | Yes |
| **Matches (regex)** | Value matches the regex pattern | Yes |
| **Greater Than** | Numeric comparison — actual > expected | Yes |
| **Greater Than or Equal** | Numeric comparison — actual >= expected | Yes |
| **Less Than** | Numeric comparison — actual < expected | Yes |
| **Less Than or Equal** | Numeric comparison — actual <= expected | Yes |
| **In (array)** | Value is a member of the expected array | Yes |
| **Not In (array)** | Value is not a member of the expected array | Yes |

#### Post-Processing Expected

Expected key-value pairs in the post-processed extraction results (after the context transformer runs). Each pair specifies:

| Column | Description |
|---|---|
| **Key** | The output key from the post-processing result. |
| **Comparison Mode** | Same modes as Data Extraction. |
| **Expected Value** | The expected value for this key. |

### Metadata & History Tabs

- **Metadata** — View immutable identifiers (Scenario ID, Project ID, Version, timestamps).
- **History** — Audit log of changes with version recovery via [Entity History](../guide/core-concepts#entity-history).

## Running a Scenario

Scenarios are executed from the Scenarios list view by clicking the **Run** button on a scenario row. This opens the **Run Scenarios** modal where you:

1. Select one or more [testers](./testers) to use.
2. Specify how many conversations each tester should have.
3. Click **Run** to start the test run.

The run is asynchronous — you'll be redirected to the [Test Runs](./test-runs) list where you can monitor progress and view results once complete.
