import { HelpCommand } from "./help";
import { StartVotingCommand } from "./voting";
import { FetchHistoryCommand } from "./history";
import { CheckVotesCommand } from "./checkVotes";
import { EndAdventureCommand } from "./adventure";
import { RequestUpgradeCommand } from "./upgrade";
import { SetMilestoneCommand, ListMilestonesCommand } from "./milestones";
import { AddStructureCommand, ListStructuresCommand } from "./structures";

export const CommandList = [
    AddStructureCommand,
    ListStructuresCommand,
    CheckVotesCommand,
    SetMilestoneCommand,
    ListMilestonesCommand,
    FetchHistoryCommand,
    EndAdventureCommand,
    RequestUpgradeCommand,
    StartVotingCommand,
    HelpCommand
];
