// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {

    // Enum to store the workflow status
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    // Variable to store the workflow status
    WorkflowStatus public status;

    // Struct to store information about a proposal
    struct Proposal {
        string description;
        uint voteCount;
    }

    // Array to store the proposals
    Proposal[] public proposals;

    // Struct to store information about a voter
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    // Mapping to store the voter information
    mapping (address => Voter) public voters;

    // Mapping to store whitelist as address=>allowedToVote
    mapping (address => bool) public whitelist;

    // Event to emit when a voter is registered
    event VoterRegistered(address voterAddress); 

    // Event to emit when the workflow status changes
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    // Event to emit when a proposal is registered
    event ProposalRegistered(uint proposalId);

    // Event to emit when a voter casts their vote
    event Voted (address voter, uint proposalId);

    // Constructor to set the initial status of the workflow
    constructor()  {
        status = WorkflowStatus.RegisteringVoters;
    }

    // function that moves the workflow to the next status in the correct order
    function nextStatus() public onlyOwner {
        WorkflowStatus previousStatus = status;
            if (status == WorkflowStatus.RegisteringVoters) {
                status = WorkflowStatus.ProposalsRegistrationStarted;
            } else if (status == WorkflowStatus.ProposalsRegistrationStarted) {
                status = WorkflowStatus.ProposalsRegistrationEnded;
            } else if (status == WorkflowStatus.ProposalsRegistrationEnded) {
                status = WorkflowStatus.VotingSessionStarted;
            } else if (status == WorkflowStatus.VotingSessionStarted) {
                status = WorkflowStatus.VotingSessionEnded;
            } else if (status == WorkflowStatus.VotingSessionEnded) {
                status = WorkflowStatus.VotesTallied;
            } else {
                revert("The workflow status cannot be changed from its current state.");
            }
        emit WorkflowStatusChange(previousStatus, status);
    }


    function getStatus() public view returns (WorkflowStatus) {
        return status;
    }

    // Function to add a voter to the whitelist
    function registerVoter(address voter) public onlyOwner{
        require(status == WorkflowStatus.RegisteringVoters, "Voters can only be registered during the voter registration phase");
        require(!whitelist[voter], "Voter has already been registered");
        whitelist[voter] = true;
        voters[voter].isRegistered = true;
        emit VoterRegistered(voter);
    }

    // Function to add a proposal
    function addProposal(string memory description) public {
        require(status == WorkflowStatus.ProposalsRegistrationStarted, "Proposals can only be registered during the proposal registration phase");
        Proposal memory newProposal = Proposal({
            description: description,
            voteCount: 0
        });
        proposals.push(newProposal);
        emit ProposalRegistered(proposals.length - 1);
    }


    // Function to vote for a proposal
    function vote(uint proposalId) public {
        require(status == WorkflowStatus.VotingSessionStarted, "Voting can only be done during the voting session");
        require(whitelist[msg.sender], "Sender is not in the whitelist");
        require(proposalId < proposals.length, "Invalid proposal ID");
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = proposalId;
        proposals[proposalId].voteCount += 1;
        emit Voted(msg.sender, proposalId);
    }

    // Function to get the winning proposal
    function getWinner() public view returns (uint) {
        require(status == WorkflowStatus.VotesTallied, "Votes can only be tallied after the voting session has ended");
        uint winningProposalId = 0;
        uint maxVotes = proposals[0].voteCount;
        for (uint i = 1; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVotes) {
                winningProposalId = i;
                maxVotes = proposals[i].voteCount;
            }
        }
        return winningProposalId;
    }

}
