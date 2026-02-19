"""Alert Service for Critical Events"""
from sqlalchemy.orm import Session
from app.db.crud import AlertCRUD
from app.core.settings import settings
import httpx
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AlertService:
    """Manages alert creation and webhook delivery"""
    
    def __init__(self, db: Session):
        self.db = db
        self.webhook_url = getattr(settings, 'alert_webhook_url', None)
    
    async def create_critical_alert(
        self,
        event_type: str,
        payload: dict,
        inference_id: str = None
    ) -> dict:
        """
        Create alert for CRITICAL tier events and send webhook.
        Does not crash if webhook fails.
        """
        # Create alert record in database
        alert = AlertCRUD.create(
            db=self.db,
            event_type=event_type,
            payload=payload,
            delivered=False
        )
        
        logger.warning(
            f"CRITICAL alert created: {event_type} "
            f"(alert_id: {alert.id}, inference_id: {inference_id})"
        )
        
        # Attempt webhook delivery
        delivered = False
        webhook_response = None
        
        if self.webhook_url:
            delivered, webhook_response = await self._send_webhook(alert, payload)
            
            # Update delivery status
            if delivered:
                AlertCRUD.mark_delivered(self.db, str(alert.id))
        else:
            logger.warning("No webhook URL configured, alert stored in DB only")
        
        return {
            "alert_id": str(alert.id),
            "event_type": event_type,
            "delivered": delivered,
            "webhook_response": webhook_response,
            "timestamp": alert.timestamp.isoformat() + "Z"
        }
    
    async def _send_webhook(self, alert, payload: dict) -> tuple:
        """
        Send webhook POST request.
        Returns (success: bool, response: dict)
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                webhook_payload = {
                    "alert_id": str(alert.id),
                    "event_type": alert.event_type,
                    "timestamp": alert.timestamp.isoformat() + "Z",
                    "severity": "CRITICAL",
                    "payload": payload
                }
                
                response = await client.post(
                    self.webhook_url,
                    json=webhook_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in [200, 201, 202]:
                    logger.info(
                        f"Webhook delivered successfully: {alert.id} "
                        f"(status: {response.status_code})"
                    )
                    return True, {
                        "status_code": response.status_code,
                        "response": response.text[:200]
                    }
                else:
                    logger.error(
                        f"Webhook delivery failed: {alert.id} "
                        f"(status: {response.status_code})"
                    )
                    return False, {
                        "status_code": response.status_code,
                        "error": response.text[:200]
                    }
                    
        except httpx.TimeoutException:
            logger.error(f"Webhook timeout for alert {alert.id}")
            return False, {"error": "Webhook request timeout"}
        except Exception as e:
            logger.error(f"Webhook delivery exception for alert {alert.id}: {e}")
            return False, {"error": str(e)}
    
    async def test_webhook(self) -> dict:
        """Test webhook connectivity"""
        if not self.webhook_url:
            return {
                "success": False,
                "error": "No webhook URL configured"
            }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                test_payload = {
                    "test": True,
                    "message": "FinGuard Sentinel webhook test",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
                response = await client.post(
                    self.webhook_url,
                    json=test_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                return {
                    "success": response.status_code in [200, 201, 202],
                    "status_code": response.status_code,
                    "response": response.text[:200],
                    "webhook_url": self.webhook_url
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "webhook_url": self.webhook_url
            }
