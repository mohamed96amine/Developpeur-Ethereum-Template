const {expectRevert, expectEvent, BN} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Voting = artifacts.require('Voting');

contract('Tests Voting Contract', function(accounts) {
  ////////////// ADDRESSES
  const _owner = accounts[0];
  const _firstVoter = accounts[1];
  const _secondVoter = accounts[2];
  const _unregisteredVoter = accounts[3];

  ////////////// PROPOSALS
  const _genesisProposal = new BN(0);
  const _firstProposal = new BN(1);
  const _secondProposal = new BN(2);

  ////////////// VALUES
  const _defaultValue = new BN(0);

  
  ////////////// STATUSES
  const WorkflowStatusRegisteringVoters = new BN(0);
  const WorkflowStatusProposalsRegistrationStarted = new BN(1);
  const WorkflowStatusProposalsRegistrationEnded = new BN(2);
  const WorkflowStatusVotingSessionStarted = new BN(3);
  const WorkflowStatusVotingSessionEnded = new BN(4);
  const WorkflowStatusVotesTallie = new BN(5);

  describe('Ownership', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
    });

    it('[owner], Ownership has been transferred', async function() {
      expect(await this.Voting.owner()).to.equal(_owner);
    });
  });

  describe('Add voters access rights', () => {
      before(async function() {
        this.Voting = await Voting.new({from: _owner});
      });

      it('[voter], should not be able to add voters', async function() {
        await expectRevert(this.Voting.addVoter(_unregisteredVoter, {from: _firstVoter}), 'Ownable: caller is not the owner');
      });

      it('[unregisteredVoter], should not be able to access voters information', async function() {
        await expectRevert(this.Voting.getVoter(_firstVoter, {from: _unregisteredVoter}), 'You\'re not a voter');
      });

      it('[owner], should be able to add voter', async function() {
        const result = await this.Voting.addVoter(_firstVoter);
        expectEvent(result, 'VoterRegistered', {
          voterAddress: _firstVoter,
        });

        const newVoter = await this.Voting.getVoter(_firstVoter, {from: _firstVoter});
        expect(newVoter.isRegistered).to.equal(true);
        expect(newVoter.hasVoted).to.equal(false);
        expect(newVoter.votedProposalId).to.be.bignumber.equal(_defaultValue);
      });

      it('[owner], should not be able to register twice same voter', async function() {
        await expectRevert(this.Voting.addVoter(_firstVoter), 'Already registered');
      });
    });

  describe('Voter informations', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
      await this.Voting.addVoter(_firstVoter, {from: _owner});
      this.Voting.addVoter(_secondVoter);
    });

    it('[unregisteredVoter], should not be able to get to vote', async function() {
      await expectRevert(this.Voting.getVoter(_firstVoter, {from: _unregisteredVoter}), 'You\'re not a voter');
    });

    
    it('[registeredVoter], should be able to get their own vote', async function() {
      const vote = await this.Voting.getVoter(_firstVoter, {from: _firstVoter});
      expect(vote.isRegistered).to.equal(true);
      expect(vote.hasVoted).to.equal(false);
      expect(vote.votedProposalId).to.be.bignumber.equal(_defaultValue);
    });

    it('[registeredVoter], should not be able to add a proposal', async function() {
      await expectRevert(this.Voting.addProposal('This will fail', {from: _firstVoter}), 'Proposals are not allowed yet');
    });

    it('[registeredVoter], should get others\' voters votes', async function() {
      const voteFromAnotherVoter = await this.Voting.getVoter(_secondVoter, {from: _firstVoter});
      expect(voteFromAnotherVoter.isRegistered).to.equal(true);
      expect(voteFromAnotherVoter.hasVoted).to.equal(false);
      expect(voteFromAnotherVoter.votedProposalId).to.be.bignumber.equal(_defaultValue);
    });
  });

  describe('Retrieve proposals informations', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
      await this.Voting.addVoter(_firstVoter);
      await this.Voting.startProposalsRegistering();
    });

    it('[registeredVoter], should be able to get a proposal\'s informations', async function() {
      const proposal = await this.Voting.getOneProposal(_genesisProposal, {from: _firstVoter});
      expect(proposal.description).to.equal('GENESIS');
      expect(proposal.voteCount).to.be.bignumber.equal(_defaultValue);
    });

    it('[owner], should not be able to add new voters after starting proposal registration', async function() {
      await expectRevert(this.Voting.addVoter(_secondVoter, {from: _owner}), 'Voters registration is not open yet');
    });

    it('[unregisteredVoter], should not be able to get a proposal if unregistered', async function() {
      await expectRevert(this.Voting.getOneProposal(_firstVoter, {from: _unregisteredVoter}), 'You\'re not a voter');
    });


  });

  describe('Workflow status update', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
    });

    it('Should start with RegisteringVoters', async function() {
      const current = await this.Voting.workflowStatus.call();
      expect(current).to.be.bignumber.equal(WorkflowStatusRegisteringVoters);
    });

    it('Should only be able to call \'startProposalsRegistering\' in RegisteringVoters status', async function() {
      await expectRevert(this.Voting.endProposalsRegistering({from: _owner}), 'Registering proposals havent started yet');
      await expectRevert(this.Voting.startVotingSession({from: _owner}), 'Registering proposals phase is not finished');
      await expectRevert(this.Voting.endVotingSession({from: _owner}), 'Voting session havent started yet');
    });

    it('Should start with RegisteringVoters', async function() {
      const resultStartProposalsRegistering = await this.Voting.startProposalsRegistering({from: _owner});
      expectEvent(resultStartProposalsRegistering, 'WorkflowStatusChange', {
        previousStatus: WorkflowStatusRegisteringVoters,
        newStatus: WorkflowStatusProposalsRegistrationStarted,
      });
    });

    it('Should only be able to call \'endProposalsRegistering\' in ProposalsRegistrationStarted status', async function() {
      await expectRevert(this.Voting.startProposalsRegistering({from: _owner}), 'Registering proposals cant be started now');
      await expectRevert(this.Voting.startVotingSession({from: _owner}), 'Registering proposals phase is not finished');
      await expectRevert(this.Voting.endVotingSession({from: _owner}), 'Voting session havent started yet');
    });

    it('Should start with ProposalsRegistrationStarted', async function() {
      const resultEndProposalsRegistering = await this.Voting.endProposalsRegistering({from: _owner});
      expectEvent(resultEndProposalsRegistering, 'WorkflowStatusChange', {
        previousStatus: WorkflowStatusProposalsRegistrationStarted,
        newStatus: WorkflowStatusProposalsRegistrationEnded,
      });
    });

    it('Should only be able to call \'startVotingSession\' in ProposalsRegistrationEnded status', async function() {
      await expectRevert(this.Voting.startProposalsRegistering({from: _owner}), 'Registering proposals cant be started now');
      await expectRevert(this.Voting.endProposalsRegistering({from: _owner}), 'Registering proposals havent started yet');
      await expectRevert(this.Voting.endVotingSession({from: _owner}), 'Voting session havent started yet');
    });

    it('Should start with ProposalsRegistrationEnded', async function() {
      const resultStartVotingSession = await this.Voting.startVotingSession({from: _owner});
      expectEvent(resultStartVotingSession, 'WorkflowStatusChange', {
        previousStatus: WorkflowStatusProposalsRegistrationEnded,
        newStatus: WorkflowStatusVotingSessionStarted,
      });
    });

    it('Should only be able to call \'startVotingSession\' in ProposalsRegistrationEnded status', async function() {
      await expectRevert(this.Voting.startProposalsRegistering({from: _owner}), 'Registering proposals cant be started now');
      await expectRevert(this.Voting.endProposalsRegistering({from: _owner}), 'Registering proposals havent started yet');
      await expectRevert(this.Voting.startVotingSession({from: _owner}), 'Registering proposals phase is not finished');
    });

    it('Should start with VotingSessionStarted status', async function() {
      const resultEndVotingSession = await this.Voting.endVotingSession({from: _owner});
      expectEvent(resultEndVotingSession, 'WorkflowStatusChange', {
        previousStatus: WorkflowStatusVotingSessionStarted,
        newStatus: WorkflowStatusVotingSessionEnded,
      });
    });
  });

 

  describe('Handle proposals rights', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
      await this.Voting.addVoter(_firstVoter);
      await this.Voting.startProposalsRegistering();
    });

    it('[registeredvoter], should be able to add a proposal', async function() {
      await expectRevert(this.Voting.addProposal('foo', {from: _unregisteredVoter}), 'You\'re not a voter');
    });

    it('[registeredvoter], should not be able add an empty proposal', async function() {
      await expectRevert(this.Voting.addProposal('', {from: _firstVoter}), 'Vous ne pouvez pas ne rien proposer');
    });

    it('[registeredvoter], should be able to add a proposal', async function() {
      const firstProposalDesc = 'Description of the first proposal';

      const addProposalResult = await this.Voting.addProposal(firstProposalDesc, {from: _firstVoter});
      expectEvent(addProposalResult, 'ProposalRegistered', {
        proposalId: _firstProposal,
      });

      const newProposal = await this.Voting.getOneProposal(_firstProposal, {from: _firstVoter});
      expect(newProposal.description).to.equal(firstProposalDesc);
      expect(newProposal.voteCount).to.be.bignumber.equal(_defaultValue);
    });

    it('[registeredvoter], should be able to add another proposal', async function() {
      const secondProposalDesc = 'Description of the second proposal';

      const addProposalResult = await this.Voting.addProposal(secondProposalDesc, {from: _firstVoter});
      expectEvent(addProposalResult, 'ProposalRegistered', {
        proposalId: _secondProposal,
      });

     const newProposal = await this.Voting.getOneProposal(_secondProposal, {from: _firstVoter});
      expect(newProposal.description).to.equal(secondProposalDesc);
      expect(newProposal.voteCount).to.be.bignumber.equal(_defaultValue);
    });
  });

    describe('Handle tallying', () => {
    before(async function() {
      this.Voting = await Voting.new({from: _owner});
      await this.Voting.addVoter(_firstVoter);
      await this.Voting.startProposalsRegistering();
      await this.Voting.addProposal('prop', {from: _firstVoter});
      await this.Voting.endProposalsRegistering();
      await this.Voting.startVotingSession();
      await this.Voting.setVote(_firstProposal, {from: _firstVoter});
    });

    it('[owner], should be able to tally votes', async function() {
      await expectRevert(this.Voting.tallyVotes({from: _firstVoter}), 'Ownable: caller is not the owner');
    });

    it('[owner], should not be able to tally if not VotesTallied status', async function() {
      await expectRevert(this.Voting.tallyVotes(), 'Current status is not voting session ended');
    });

    it('[owner], should be able to end voting session', async function() {
      await this.Voting.endVotingSession();

      const result = await this.Voting.tallyVotes();
      expectEvent(result, 'WorkflowStatusChange', {
        previousStatus: WorkflowStatusVotingSessionEnded,
        newStatus: WorkflowStatusVotesTallie,
      });
    });


    it('winningProposalID should be 1 after tally', async function() {
      const status = await this.Voting.winningProposalID.call();
      expect(status).to.be.bignumber.equal(_firstProposal);
    });

    it('The workflow status should be VotesTallied', async function() {
      const status = await this.Voting.workflowStatus.call();
      expect(status).to.be.bignumber.equal(WorkflowStatusVotesTallie);
    });
  });


  describe('Handle voting rights', () => {
    before(async function() {
      const firstProposalDesc = 'Description of the first proposal';
      const secondProposalDesc = 'Description of the second proposal';
      this.Voting = await Voting.new({from: _owner});
      await this.Voting.addVoter(_firstVoter);
      await this.Voting.startProposalsRegistering();
      await this.Voting.addProposal('firstProposalDesc', {from: _firstVoter});
      await this.Voting.addProposal('secondProposalDesc', {from: _firstVoter});
      await this.Voting.endProposalsRegistering();
    });

    it('[registeredvoter], should be able to vote', async function() {
      await expectRevert(this.Voting.setVote(_secondProposal, {from: _unregisteredVoter}), 'You\'re not a voter');
    });

    it('[registeredvoter], should not be able to vote when not VotingSession', async function() {
      await expectRevert(this.Voting.setVote(_secondProposal, {from: _firstVoter}), 'Voting session havent started yet');
    });

    it('[registeredvoter], should only be able to vote for existing proposals', async function() {
      await this.Voting.startVotingSession();
      await expectRevert(this.Voting.setVote(new BN(42), {from: _firstVoter}), 'Proposal not found');
    });

    it('[registeredvoter], should be able to vote on proposal', async function() {
      const votedProposal = await this.Voting.getOneProposal(_secondProposal, {from: _firstVoter});
      expect(votedProposal.voteCount).to.be.bignumber.equal(_defaultValue);

      const voterBeforeVoting = await this.Voting.getVoter(_firstVoter, {from: _firstVoter});
      expect(voterBeforeVoting.isRegistered).to.equal(true);
      expect(voterBeforeVoting.hasVoted).to.equal(false);
      expect(voterBeforeVoting.votedProposalId).to.be.bignumber.equal(_defaultValue);

      const voteResult = await this.Voting.setVote(_secondProposal, {from: _firstVoter});
      expectEvent(voteResult, 'Voted', {
        voter: _firstVoter,
        proposalId: _secondProposal,
      });

      voterAfterVoting = await this.Voting.getVoter(_firstVoter, {from: _firstVoter});
      expect(voterAfterVoting.isRegistered).to.equal(true);
      expect(voterAfterVoting.hasVoted).to.equal(true);
      expect(voterAfterVoting.votedProposalId).to.be.bignumber.equal(_secondProposal);
    });

    it('[registeredvoter], should not be able to vote more than once', async function() {
      await expectRevert(this.Voting.setVote(_secondProposal, {from: _firstVoter}), 'You have already voted');
    });

    it('Should increment count of votes in proposal\'s counter', async function() {
      const firstProp = await this.Voting.getOneProposal(_genesisProposal, {from: _firstVoter});
      expect(firstProp.voteCount).to.be.bignumber.equal(_defaultValue);

      const secondProp = await this.Voting.getOneProposal(_secondProposal, {from: _firstVoter});
      expect(secondProp.voteCount).to.be.bignumber.equal(new BN(1));
    });

  });


});
