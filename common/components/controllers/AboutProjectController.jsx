// @flow

//TODO: validate all the active imports, these are the result of a messy merge
import React from 'react';
import _ from 'lodash'
// import Grid from '@material-ui/core/Grid';
// import Paper from '@material-ui/core/Paper';
// import Divider from '@material-ui/core/Divider';
import ProjectAPIUtils from '../utils/ProjectAPIUtils.js';
import type {ProjectDetailsAPIData} from '../utils/ProjectAPIUtils.js';
import ProjectDetails from '../componentsBySection/FindProjects/ProjectDetails.jsx';
import ContactProjectButton from "../common/projects/ContactProjectButton.jsx";
import ProjectVolunteerButton from "../common/projects/ProjectVolunteerButton.jsx";
import metrics from "../utils/metrics.js";
import AboutPositionEntry from "../common/positions/AboutPositionEntry.jsx";
import ProjectVolunteerModal from "../common/projects/ProjectVolunteerModal.jsx";
import CurrentUser from "../utils/CurrentUser.js";
import ProjectOwnersSection from "../common/owners/ProjectOwnersSection.jsx";
import VolunteerSection from "../common/volunteers/VolunteerSection.jsx";
import type {PositionInfo} from "../forms/PositionInfo.jsx";
import Headers from "../common/Headers.jsx";
import Truncate from "../utils/truncate.js";
import IconLinkDisplay from "../componentsBySection/AboutProject/IconLinkDisplay.jsx";
import {APIError} from "../utils/api.js";
import Sort from "../utils/sort.js";
import {LinkTypes} from "../constants/LinkConstants.js";


type State = {|
  project: ?ProjectDetailsAPIData,
  volunteers: $ReadOnlyArray<VolunteerDetailsAPIData>,
  loadStatusMsg: string,
  showJoinModal: boolean,
  positionToJoin: ?PositionInfo,
  showPositionModal: boolean,
  shownPosition: ?PositionInfo,
  tabs: object
|};

class AboutProjectController extends React.PureComponent<{||}, State> {

  constructor(): void{
    super();
    this.state = {
      project: null,
      loadStatusMsg: "Loading...",
      showContactModal: false,
      showPositionModal: false,
      shownPosition: null,
      tabs: {
        details: true,
        skills: false,
      }
    };
    this.handleUpdateVolunteers = this.handleUpdateVolunteers.bind(this);
 }

  componentDidMount() {
    const projectId: string = (new RegExp("id=([^&]+)")).exec(document.location.search)[1];
    ProjectAPIUtils.fetchProjectDetails(projectId, this.loadProjectDetails.bind(this), this.handleLoadProjectFailure.bind(this));
    metrics.logNavigateToProjectProfile(projectId);
  }

  loadProjectDetails(project: ProjectDetailsAPIData) {
    this.setState({
      project: project,
      volunteers: project.project_volunteers
    });
  }

  handleLoadProjectFailure(error: APIError) {
    this.setState({
      loadStatusMsg: "Could not load project"
    });
  }


  handleShowVolunteerModal(position: ?PositionInfo) {
    this.setState({
      showJoinModal: true,
      positionToJoin: position
    });
  }
  
  handleUpdateVolunteers(volunteers: $ReadOnlyArray<VolunteerDetailsAPIData>) {
    this.setState({
      volunteers: volunteers
    });
  }

  confirmJoinProject(confirmJoin: boolean) {
    if(confirmJoin) {
      window.location.reload(true);
    } else {
      this.setState({showJoinModal: false});
    }
  }

  changeHighlighted(tab) {
   let tabs = {
      details: false,
      skills: false,
      positions: false,
    }

    tabs[tab] = true;
    this.setState({tabs});
  }

  render(): $React$Node {
    return this.state.project ? this._renderDetails() : <div>{this.state.loadStatusMsg}</div>
  }

  _renderDetails(): React$Node {
    const project = this.state.project;
    return (
      <div className='AboutProjects-root'>
        {this._renderHeader(project)}
        <div className="AboutProjects-infoColumn">

          <div className='AboutProjects-iconContainer'>
            <img className='AboutProjects-icon'src={project && project.project_thumbnail && project.project_thumbnail.publicUrl} />
          </div>

          <div className='AboutProjects-details'>
            <ProjectDetails projectLocation={project && project.project_location}
            projectUrl={project && project.project_url}
            projectStage={project && !_.isEmpty(project.project_stage) ? project.project_stage[0].display_name : null}
            dateModified={project && project.project_date_modified}/>
          </div>

          {project && !_.isEmpty(project.project_links) &&
            <React.Fragment>
              <div className='AboutProjects-links'>
                <h4>Links</h4>
                {this._renderLinks()}
              </div>

            </React.Fragment>
          }

          { project && !_.isEmpty(project.project_files) &&
            <React.Fragment>
              <div className='AboutProjects-files'>
                <h4>Files</h4>
                  {this._renderFiles()}
              </div>

            </React.Fragment>
          }

          {project && !_.isEmpty(project.project_organization) &&
            <React.Fragment>
              <div className='AboutProjects-communities'>
                <h4>Communities</h4>
                <ul>
                  {
                    project.project_organization.map((org, i) => {
                      return <li key={i}>{org.display_name}</li>
                    })
                  }
                </ul>
              </div>

            </React.Fragment>
          }

          <div className='AboutProjects-team'>
            {
            !_.isEmpty(this.state.volunteers)
              ? <VolunteerSection
                  volunteers={this.state.volunteers}
                  isProjectAdmin={CurrentUser.userID() === project.project_creator}
                  isProjectCoOwner={CurrentUser.isCoOwner(project)}
                  projectId={project.project_id}
                  renderOnlyPending={true}
                  onUpdateVolunteers={this.handleUpdateVolunteers}
                />
              : null
            }
            <h4>Team</h4>
              {
                project && !_.isEmpty(project.project_owners)
                ? <ProjectOwnersSection
                  owners={project.project_owners}
                  />
                : null
              }

              {
              !_.isEmpty(this.state.volunteers)
                ? <VolunteerSection
                    volunteers={this.state.volunteers}
                    isProjectAdmin={CurrentUser.userID() === project.project_creator}
                    isProjectCoOwner={CurrentUser.isCoOwner(project)}
                    projectId={project.project_id}
                    renderOnlyPending={false}
                    onUpdateVolunteers={this.handleUpdateVolunteers}
                  />
                : null
              }
          </div>

        </div>

        <div className="AboutProjects-mainColumn">

          <div className='AboutProjects-intro'>
            <div className='AboutProjects-introTop'>
              <div className='AboutProjects-description'>
                <h1>{project && project.project_name}</h1>
                <p className='AboutProjects-description-issue'>{project && project.project_issue_area && project.project_issue_area.map(issue => issue.display_name).join(',')}</p>
                <p>{project && project.project_short_description}</p>
              </div>

              <ProjectVolunteerModal
                projectId={this.state.project && this.state.project.project_id}
                positions={this.state.project && this.state.project.project_positions}
                positionToJoin={this.state.positionToJoin}
                showModal={this.state.showJoinModal}
                handleClose={this.confirmJoinProject.bind(this)}
              />

              <div className='AboutProjects-owner'>
                <ContactProjectButton project={project}/>
                <ProjectVolunteerButton
                  project={project}
                  onVolunteerClick={this.handleShowVolunteerModal.bind(this)}
                />
              </div>
            </div>

            <div className="AboutProjects_tabs">

              <a onClick={() => this.changeHighlighted('details')} className={this.state.tabs.details ? 'AboutProjects_aHighlighted' : 'none'}href="#project-details">Details</a>

              {project && !_.isEmpty(project.project_positions) &&
              <a onClick={() => this.changeHighlighted('skills')} className={this.state.tabs.skills ? 'AboutProjects_aHighlighted' : 'none'} href="#positions-available">Skills Needed</a>
              }

            </div>
          </div>

          <div className='AboutProjects-details'>
            <div id='project-details'>
              {project.project_description}
            </div>

            <div className='AboutProjects-skills-container'>

              {project && !_.isEmpty(project.project_positions) &&
                <div className='AboutProjects-skills'>
                  <p id='skills-needed' className='AboutProjects-skills-title'>Skills Needed</p>
                  {project && project.project_positions && project.project_positions.map(position => <p>{position.roleTag.display_name}</p>)}
                </div>
              }

              {project && !_.isEmpty(project.project_technologies) &&
                <div className='AboutProjects-technologies'>
                  <p className='AboutProjects-tech-title'>Technologies Used</p>
                  {project && project.project_technologies && project.project_technologies.map(tech => <p>{tech.display_name}</p>)}
                </div>
              }

            </div>
          </div>

          <div className='AboutProjects-positions-available'>
            <div id="positions-available">
              {project && !_.isEmpty(project.project_positions) && this._renderPositions()}
            </div>
          </div>

        </div>

      </div>
    )
  }

  _renderHeader(project: ProjectDetailsAPIData): React$Node {
    const title: string = project.project_name + " | DemocracyLab";
    const description: string = project.project_short_description || Truncate.stringT(project.project_description, 300);

    return (
      <Headers
        title={title}
        description={description}
        thumbnailUrl={project.project_thumbnail && project.project_thumbnail.publicUrl}
      />
    );
  }

  _renderFiles(): ?Array<React$Node> {
    const project = this.state.project;
    return project && project.project_files && project.project_files.map((file, i) =>
      <div key={i}>
        <a href={file.publicUrl} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
      </div>
    );
  }

  _renderLinks(): ?Array<React$Node> {
    const project = this.state.project;
    const linkOrder = [LinkTypes.CODE_REPOSITORY, LinkTypes.FILE_REPOSITORY, LinkTypes.MESSAGING, LinkTypes.PROJECT_MANAGEMENT];
    const sortedLinks = project && project.project_links && Sort.byNamedEntries(project.project_links, linkOrder, (link) => link.linkName);
    return sortedLinks.map((link, i) =>
      <IconLinkDisplay key={i} link={link}/>
    );
  }

  _renderPositions(): ?Array<React$Node> {
    const project: ProjectDetailsAPIData = this.state.project;
    const canApply: boolean = CurrentUser.canVolunteerForProject(project);
    return project && project.project_positions && _.chain(project.project_positions).sortBy(['roleTag.subcategory', 'roleTag.display_name']).value()
      .map((position, i) => {
        return <AboutPositionEntry
          key={i}
          position={position}
          onClickApply={canApply ? this.handleShowVolunteerModal.bind(this, position) : null}
        />;
      });
    }
}

export default AboutProjectController;
