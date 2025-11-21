import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadKMZ = async (waypoints, missionName = "MiniMission") => {
  const zip = new JSZip();
  const now = Date.now();

  const templateXML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    <wpml:createTime>${now}</wpml:createTime>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>goHome</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>hover</wpml:executeRCLostAction>
      <wpml:globalTransitionalSpeed>2.5</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>68</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
  </Document>
</kml>`;

  let placemarks = "";
  waypoints.forEach((wp, i) => {
    const isFirst = i === 0;
    const actionId = i + 1;
    
    const actionXML = `
      <wpml:actionGroup>
        <wpml:actionGroupId>${actionId}</wpml:actionGroupId>
        <wpml:actionGroupStartIndex>${i}</wpml:actionGroupStartIndex>
        <wpml:actionGroupEndIndex>${i}</wpml:actionGroupEndIndex>
        <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
        <wpml:actionTrigger>
          <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
        </wpml:actionTrigger>
        <wpml:action>
          <wpml:actionId>${actionId}</wpml:actionId>
          <wpml:actionActuatorFunc>${isFirst ? 'gimbalRotate' : 'gimbalEvenlyRotate'}</wpml:actionActuatorFunc>
          <wpml:actionActuatorFuncParam>
            <wpml:gimbalPitchRotateAngle>${wp.gimbalPitch}</wpml:gimbalPitchRotateAngle>
            <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            ${isFirst ? `<wpml:gimbalHeadingYawBase>aircraft</wpml:gimbalHeadingYawBase>
              <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
              <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>` : ''}
          </wpml:actionActuatorFuncParam>
        </wpml:action>
      </wpml:actionGroup>`;

    placemarks += `
    <Placemark>
      <Point><coordinates>${wp.lng},${wp.lat}</coordinates></Point>
      <wpml:index>${i}</wpml:index>
      <wpml:executeHeight>${wp.altitude}</wpml:executeHeight>
      <wpml:waypointSpeed>${wp.speed}</wpml:waypointSpeed>
      <wpml:waypointHeadingParam>
        <wpml:waypointHeadingMode>smoothTransition</wpml:waypointHeadingMode>
        <wpml:waypointHeadingAngle>${wp.heading}</wpml:waypointHeadingAngle>
        <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
        <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
      </wpml:waypointHeadingParam>
      <wpml:useStraightLine>0</wpml:useStraightLine>
      ${actionXML}
    </Placemark>`;
  });

  const waylinesXML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>goHome</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>hover</wpml:executeRCLostAction>
      <wpml:globalTransitionalSpeed>2.5</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>68</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateId>0</wpml:templateId>
      <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>
      <wpml:waylineId>0</wpml:waylineId>
      <wpml:autoFlightSpeed>2.5</wpml:autoFlightSpeed>
      ${placemarks}
    </Folder>
  </Document>
</kml>`;

  const wpmz = zip.folder("wpmz");
  wpmz.file("template.kml", templateXML);
  wpmz.file("waylines.wpml", waylinesXML);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${missionName}.kmz`);
};