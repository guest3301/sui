from hypothesis import given, strategies as st, settings, HealthCheck
from backend.models import User, Settings, db
from datetime import datetime

@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    sensitivity=st.floats(min_value=0.0, max_value=1.0),
    threshold=st.integers(min_value=1, max_value=3600),
    websites=st.lists(st.text(min_size=1, max_size=50), max_size=10),
    style=st.sampled_from(['gentle', 'moderate', 'strict'])
)
def test_settings_persistence_round_trip(db_session, sensitivity, threshold, websites, style):
    user = User(
        username=f'testuser_{datetime.utcnow().timestamp()}',
        passkey_credential=b'test_credential',
        totp_secret='test_secret'
    )
    db_session.add(user)
    db_session.commit()
    
    settings = Settings(
        user_id=user.id,
        dark_pattern_sensitivity=sensitivity,
        doomscroll_time_threshold=threshold,
        intervention_style=style
    )
    settings.set_enabled_websites(websites)
    db_session.add(settings)
    db_session.commit()
    
    settings_id = settings.id
    db_session.expunge_all()
    
    retrieved_settings = db_session.query(Settings).filter_by(id=settings_id).first()
    
    assert retrieved_settings is not None
    assert abs(retrieved_settings.dark_pattern_sensitivity - sensitivity) < 0.0001
    assert retrieved_settings.doomscroll_time_threshold == threshold
    assert retrieved_settings.get_enabled_websites() == websites
    assert retrieved_settings.intervention_style == style
