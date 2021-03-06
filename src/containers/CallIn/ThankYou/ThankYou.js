import React, { Component } from 'react';
import { Button, Card, Col, Icon, message, Row, Typography } from 'antd';
import { Redirect } from 'react-router-dom';
import styled from '@emotion/styled'
import { connect } from "react-redux";

import SimpleLayout from '../../Layout/SimpleLayout/SimpleLayout';
import axios from '../../../util/axios-api';
import getUrlParameter from '../../../util/urlparams';

import capitol from '../../../assets/images/capitol-group.jpg';
import discussion from '../../../assets/images/discussion.jpeg';
import grassroots from '../../../assets/images/grassroots.jpg';
import OtherCallTargets from './OtherCallTargets';
import CallStats from './CallStats/CallStats'


const CONTENT_WIDTH_PX = 900
const StyledRow = styled(Row)`
    background: ${props => props.bg};
    padding: 1.4em;

    @media (min-width: ${CONTENT_WIDTH_PX + 20}px) {
        padding: 2em calc(50vw - ${CONTENT_WIDTH_PX / 2}px);
    }
`
const ColorContentRow = ({ bg, children}) => (
    <StyledRow 
        bg={bg || 'transparent'} 
        type="flex" 
        justify="center" 
        gutter={[20, 20]}
    >
        {children}
    </StyledRow>
)

class ThankYou extends Component {

    state = {
        callerId: null,
        eligibleCallTargets: [],
        district: null,
        homeDistrictNumber: null,
        localStats: null,
        overallStats: null,
        statsError: null,
        signUpRedirect: false,
        trackingToken: null
    }

    componentDidMount = () => {
        const params = this.props.location.search;
        const calledState = getUrlParameter(params, 'state') && getUrlParameter(params, 'state').toUpperCase();
        const calledNumber = getUrlParameter(params, 'district');
        const homeDistrictNumber = getUrlParameter(params, 'd') || undefined;
        const trackingToken = getUrlParameter(params, 't') || undefined;
        const callerId = getUrlParameter(params, 'c') || undefined;
        this.removeTrackingGetArgs();
        this.fetchDistricts((districts) => {
            const calledDistrict = this.findDistrictByStateNumber(calledState, calledNumber, districts);
            if(!calledDistrict && !calledDistrict.districtId){
                this.setState({
                    statsError: Error("No district found")
                })
                return;
            } else {
                this.setStats(calledDistrict);
                const eligibleCallTargets = this.eligibleCallTargetDistrictIds(
                    homeDistrictNumber, 
                    calledState, 
                    calledNumber, 
                    districts
                )
                this.setState({
                    homeDistrictNumber,
                    trackingToken,
                    callerId,
                    district: calledDistrict,
                    eligibleCallTargets: eligibleCallTargets.length ? eligibleCallTargets : null,                    
                })
            }
        })
    }

    eligibleCallTargetDistrictIds = (homeDistrictNumber, calledState, calledNumber, districts) => {
        const callExpiry = Date.now() - (1000 * 60 * 60) // 1 hour in milliseconds
        return [-1, -2, homeDistrictNumber]
            .filter(el => {
                return `${el}` !== `${calledNumber}`
            })
            .map(districtNumber => {
                return this.findDistrictByStateNumber(calledState, districtNumber, districts)
            })
            // Filter out the `covid_paused` districts
            .filter(district => district && district.status === 'active')
            .map(district =>  {
                const hasMadeCalls = this.props.calls && this.props.calls.byId
                if (!hasMadeCalls) {
                    return district
                }
                const hasCalledThisDistrict = Object.entries(this.props.calls.byId).find((entry)=>{
                    const [districtId, timestamp] = entry
                    return districtId === `${district.districtId}` && timestamp > callExpiry
                })
                district['alreadyCalled'] = hasCalledThisDistrict
                return district
            })
    }

    fetchDistricts = (cb) => {
        axios.get('districts').then((response)=>{
            const districts = response.data;
            cb(districts)
        });
    }

    findDistrictByStateNumber = (state, number, districts) => {
        return districts.find(el => (
            state.toLowerCase() === el.state.toLowerCase() && parseInt(number) === parseInt(el.number)
        ))
    }

    setStats = (district) => {
        Promise.all(
            [
                axios.get(`stats/${district.districtId}`), 
                axios.get(`stats`)
            ])
            .then(values => {
                const district = values[0].data
                const overall = values[1].data
                this.setState({
                    localStats: district,
                    overallStats: overall
                })
            }).catch((error) => {
                this.setState({
                    statsError: error
                })
            });
    }

    handleShare = (platform) => {
        switch (platform) {
            case 'facebook':
                this.openInNewTab('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fcitizensclimatelobby.org/monthly-calling-campaign')
                break;
            case 'twitter':
                this.openInNewTab('https://twitter.com/intent/tweet?text=Check+out+citizensclimatelobby.org/monthly-calling-campaign.+It%27s+a+great+way+for+individuals+to+make+a+difference+on+climate+change.')
                break;
            default:
                this.copyToClipboard('https://citizensclimatelobby.org/monthly-calling-campaign')
                message.success('A shareable link has been copied to your clipboard.')
            break;
        }
    }

    copyToClipboard = str => {
        const el = document.createElement('textarea');
        el.value = str;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      };

    openInNewTab = (url) => {
        var win = window.open(url, '_blank');
        win.focus();
      }

    removeTrackingGetArgs = () => {
        try {
            const urlParams = new URLSearchParams(this.props.location.search.slice(1));
            urlParams.delete('t');
            urlParams.delete('d');
            urlParams.delete('c');
            this.props.history.push({
                pathname: this.props.history.location.pathname,
                search: `${urlParams.toString()}`,
                state: {...this.state}
            })
        } catch(error) {
            console.error(error);
        }
        
    }

    alreadyCalledDistricts = () => {
        if (this.props.calls && this.props.calls.byId) {
            return this.props.calls.byId.map((el)=> {
                return el.district
            })
        } else {
            return []
        }
    }

    render() {
        if (this.state.signUpRedirect) {
            return <Redirect to="/signup" />
        }

        return (
            <SimpleLayout activeLinkKey="/signup">
                <ColorContentRow bg="#ececec">
                    <Col xs={24} align="center">
                        <Typography.Title level={1}>Thank You for Calling</Typography.Title>
                    </Col>
                    {this.state.district && this.state.localStats && (
                        <Col sm={24} md={12} lg={14}>
                            <CallStats 
                                district={this.state.district} 
                                localStats={this.state.localStats} 
                                overallStats={this.state.overallStats} 
                            /> 
                        </Col>
                    )}
                    {this.state.eligibleCallTargets && (
                        <Col sm={24} md={12} lg={10}>
                            <OtherCallTargets 
                                homeDistrictNumber={this.state.homeDistrictNumber}
                                callerId={this.state.callerId}
                                trackingToken={this.state.trackingToken}
                                districts={this.state.eligibleCallTargets}
                            />
                        </Col>
                    )}
                </ColorContentRow>
                <ColorContentRow>
                    {
                        !this.state.identifier && (<Col xs={24} md={8} lg={6}>
                            <Card
                                cover={<img alt="US Captitol Building" src={capitol} />}
                                actions={[]}
                            >
                                <Typography.Paragraph>
                                    If you haven't done it already, sign up to get a monthly call reminder.
                                </Typography.Paragraph>
                                <Button
                                    onClick={()=>{this.setState({signUpRedirect: true})}}
                                >
                                    <Icon type="notification" /> Get Reminders
                                </Button>
                            </Card>
                        </Col>)
                    }
                    <Col xs={24} md={8} lg={6}>
                        <Card
                            cover={<img alt="US Captitol Building" src={discussion} />}
                            actions={[
                                <Icon type="facebook" onClick={()=>{this.handleShare('facebook')}} />, 
                                <Icon type="twitter" onClick={()=>{this.handleShare('twitter')}} />, 
                                <Icon type="mail" onClick={()=>{this.handleShare('email')}} />
                            ]}
                        >
                            <Typography>
                                The more people who call, the more our representatives listen.
                            </Typography>
                        </Card>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <Card
                            cover={<img alt="Volunteer with clipboard" src={grassroots} />}
                        >
                            <Typography.Paragraph>
                            Learn more about Citizens' Climate Lobby and what we do
                            </Typography.Paragraph>
                            <Button
                                onClick={()=>{this.openInNewTab('https://citizensclimatelobby.org/join-citizens-climate-lobby/')}}
                            >
                                <Icon type="team" /> Join CCL
                            </Button>
                        </Card>
                    </Col>
                </ColorContentRow>
            </SimpleLayout>
        )
    }
}

const mapStateToProps = state => {
    const { calls } = state;
    return { calls };
};

export default connect(mapStateToProps)(ThankYou);