## Ownership : 

This section of tests verifies the ownership functionality of the Voting smart contract using the Mocha testing framework and Chai assertion library in JavaScript. The tests are enclosed in a describe block and consist of a before hook and a single test case.

In the before hook, the Voting contract instance is created and stored in the this.Voting variable using the await Voting.new() method, which deploys the contract on the blockchain.

The test case is defined using the it function and checks that the ownership of the contract is correctly set to the _owner address. It does so by calling the owner function on the Voting contract instance and verifying that the returned value is equal to the _owner address.

This test ensures that the ownership functionality of the Voting contract works as expected, and that the contract can only be controlled by the designated owner address.


## Add voters access rights

This section of tests is focused on testing the functionality related to adding voters access rights to the voting system.

The before function is executed before running the tests in this section, and it creates a new instance of the Voting contract, which is used throughout these tests.

The first test in this section checks whether a voter account (i.e., an account that is not the owner) is not able to add new voters to the system. The test expects that the addVoter function will revert with an error message stating that the caller is not the owner.

The second test checks whether an unregistered voter is not able to access the information of other voters in the system. The test expects that the getVoter function will revert with an error message stating that the caller is not a voter.

The third test checks whether the owner of the system is able to add a new voter. The test expects that the addVoter function will emit a VoterRegistered event with the correct voter address, and that the information of the new voter can be retrieved correctly using the getVoter function.

The fourth test checks whether the owner is not able to register the same voter twice. The test expects that the addVoter function will revert with an error message stating that the voter is already registered.


## Retrieve proposals informations

This section of tests is checking the functionality related to retrieving proposal information.

Before running the tests, the before hook creates a new instance of the Voting contract and adds the _firstVoter as a registered voter, and then starts the proposal registration.

The first test case checks that a registered voter can retrieve the information of a proposal. The test uses the getOneProposal() method of the Voting contract to retrieve information about the _genesisProposal. The test checks that the description of the proposal is 'GENESIS' and that the vote count is equal to _defaultValue.

The second test case checks that the owner is not able to add new voters after starting the proposal registration. The test tries to add _secondVoter as a new voter using the addVoter() method of the Voting contract and expects to receive the 'Voters registration is not open yet' error message.

The third test case checks that an unregistered voter is not able to retrieve the information of a proposal. The test uses the getOneProposal() method of the Voting contract to retrieve information about _firstVoter and expects to receive the 'You're not a voter' error message.


## Workflow status update

This section is a test suite that checks the workflow status of a Voting smart contract. The test suite has multiple test cases that verify the proper state transitions between the different stages of the workflow.

The before function creates a new instance of the Voting smart contract and assigns it to the this.Voting variable.

The first test case checks that the initial state of the contract is RegisteringVoters.

The second test case verifies that only startProposalsRegistering can be called in the RegisteringVoters status.

The third test case checks that the startProposalsRegistering function can only be called in the RegisteringVoters status and changes the workflow status to ProposalsRegistrationStarted.

The fourth test case verifies that only endProposalsRegistering can be called in the ProposalsRegistrationStarted status.

The fifth test case checks that the endProposalsRegistering function can only be called in the ProposalsRegistrationStarted status and changes the workflow status to ProposalsRegistrationEnded.

The sixth test case verifies that only startVotingSession can be called in the ProposalsRegistrationEnded status.

The seventh test case checks that the startVotingSession function can only be called in the ProposalsRegistrationEnded status and changes the workflow status to VotingSessionStarted.

The eighth test case verifies that only endVotingSession can be called in the VotingSessionStarted status.

The ninth and final test case checks that the endVotingSession function can only be called in the VotingSessionStarted status and changes the workflow status to VotingSessionEnded.

## Handle tallying
This section tests the functionality related to tallying votes.

It sets up the contract by adding a voter, starting the proposal registration, adding a proposal, ending the proposal registration, starting the voting session, and having the first voter cast their vote.

Then it tests the following scenarios:

    [owner], should be able to tally votes: This tests that only the contract owner can tally votes and the test will fail if a non-owner attempts to tally votes.
    [owner], should not be able to tally if not VotesTallied status: This tests that the contract owner should not be able to tally votes if the current status of the contract is not "VotesTallied". The test will fail if the owner is able to tally votes in a different status.
    [owner], should be able to end voting session: This tests that the contract owner can successfully end the voting session and transition the contract status to "VotesTallied". The test will fail if the status is not updated as expected.

## Handle voting rights
This section tests the functionality related to voting rights. It checks whether registered voters are able to vote, whether they are able to vote only during the voting session, and only on existing proposals. It also checks whether a voter can vote only once, and whether the count of votes in the proposal's counter is incremented after a successful vote.
