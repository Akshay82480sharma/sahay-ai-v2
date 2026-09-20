@router.post('/{id}/resolve', status_code=status.HTTP_200_OK)
def resolve_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail='Incident not found.')
        
    now = utcnow()
    incident.status = IncidentStatus.resolved.value
    incident.updated_at = now
    
    # Also free up resources
    assignments = db.query(Assignment).filter(Assignment.incident_id == id, Assignment.status != AssignmentStatus.completed.value).all()
    for a in assignments:
        a.status = AssignmentStatus.completed.value
        resource = db.query(Resource).filter(Resource.id == a.resource_id).first()
        if resource:
            resource.status = ResourceStatus.available.value
            events.broadcast_nowait('resource_updated', {
                'id': resource.id,
                'status': resource.status
            })
            
    db.commit()
    db.refresh(incident)
    
    events.broadcast_nowait('incident_updated', {
        'id': incident.id,
        'status': incident.status,
        'updated_at': format_iso8601_z(incident.updated_at)
    })
    
    return {'status': 'resolved'}

