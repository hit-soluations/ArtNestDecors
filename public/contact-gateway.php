<?php
/**
 * ==========================================================================
 * ARTNEST DECORS - STANDALONE BACKEND ROUTING ENGINE (WITH CUSTOMER METRICS)
 * ==========================================================================
 */
header('Content-Type: application/json');

// Security Check: Accept only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid Request Protocol."]);
    exit;
}

// Clean and sanitize inputs to prevent security injections
$channel        = isset($_POST['channel']) ? trim(strip_tags($_POST['channel'])) : '';
$customerEmail  = isset($_POST['userEmail']) ? trim(filter_var($_POST['userEmail'], FILTER_SANITIZE_EMAIL)) : '';
$customerPhone  = isset($_POST['userPhone']) ? trim(strip_tags($_POST['userPhone'])) : '';
$messageContent = isset($_POST['message']) ? trim(htmlspecialchars($_POST['message'])) : '';

if (empty($customerEmail) || empty($customerPhone) || empty($messageContent)) {
    echo json_encode(["status" => "error", "message" => "All form context fields are required."]);
    exit;
}

// Destination targets configuration
$myCompanyEmail = "info@artnestdecors.com";
$myCompanyPhone = "+919876543210"; 

/* --------------------------------------------------------------------------
   ROUTING METHOD A: EMAIL DISPATCH
   -------------------------------------------------------------------------- */
if ($channel === 'email') {
    
    $subjectLine = "New Lead - ArtNest Decors Website Inbound";
    
    // Luxury HTML formatted mail structure layout incorporating sender metrics
    $emailBody = "
    <html>
    <body style='font-family: sans-serif; background-color: #FAF8F5; padding: 25px; color: #111;'>
      <div style='max-width: 550px; background: #fff; padding: 25px; border: 1px solid #EAE3D2; border-radius: 4px;'>
        <h3 style='border-bottom: 2px solid #D4AF37; padding-bottom: 8px; text-transform: uppercase; font-size:16px; margin-top:0;'>Website Inquiry Received</h3>
        
        <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;'>
          <tr>
            <td style='padding: 5px 0; color: #666; width: 120px;'><b>Client Email:</b></td>
            <td style='padding: 5px 0; color: #111;'>{$customerEmail}</td>
          </tr>
          <tr>
            <td style='padding: 5px 0; color: #666;'><b>Client Phone:</b></td>
            <td style='padding: 5px 0; color: #111;'>{$customerPhone}</td>
          </tr>
        </table>

        <p style='font-size: 11px; text-transform: uppercase; color:#D4AF37; font-weight:bold; margin-bottom: 5px;'>Project Requirements:</p>
        <p style='background: #FAF8F5; padding: 12px; border-radius: 4px; white-space: pre-wrap; font-size:14px; line-height:1.6; margin-top:0;'>{$messageContent}</p>
      </div>
    </body>
    </html>
    ";

    $headers   = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=utf-8';
    $headers[] = 'From: system@artnestdecors.com';
    $headers[] = 'Reply-To: ' . $customerEmail; // Setting reply-to directly to the client who submitted!

    // Fire native server mail router
    if (mail($myCompanyEmail, $subjectLine, $emailBody, implode("\r\n", $headers))) {
        echo json_encode(["status" => "success", "message" => "Success! Your message and contact parameters have been logged to our studio inbox."]);
    } else {
        echo json_encode(["status" => "error", "message" => "The hosting server failed to parse and process the internal email dispatch."]);
    }
    exit;
}

/* --------------------------------------------------------------------------
   ROUTING METHOD B: SMS DISPATCH (Twilio API Gateway Setup)
   -------------------------------------------------------------------------- */
if ($channel === 'sms') {
    
    // Insert your Twilio credentials here to send automated mobile cellular text messages
    $twilioSid   = "YOUR_TWILIO_ACCOUNT_SID_HERE"; 
    $authToken   = "YOUR_TWILIO_AUTH_TOKEN_HERE";
    $twilioNumber= "YOUR_TWILIO_PHONE_NUMBER_HERE"; 
    
    // Formatting summary alert context to fit character constraints 
    $smsText = "ArtNest Alert! From: {$customerPhone} | Mail: {$customerEmail} | Msg: " . html_entity_decode($messageContent);
    $smsTextTruncated = substr($smsText, 0, 160); // Keeps within standard single SMS frame metric limits

    // Fallback tracker script logic if your keys haven't been entered yet
    if($twilioSid === "YOUR_TWILIO_ACCOUNT_SID_HERE") {
        error_log("SMS Simulation Content: " . $smsTextTruncated);
        echo json_encode([
            "status" => "success", 
            "message" => "SMS payload built! [Simulation Node: Lead parameters successfully captured and logged to target: " . $myCompanyPhone . "]"
        ]);
        exit;
    }

    // Call configuration array structure to execute real cellular network messages
    $smsPayloadData = [
        'To'   => $myCompanyPhone,
        'From' => $twilioNumber,
        'Body' => $smsTextTruncated
    ];

    $ch = curl_init("https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERPWD, "{$twilioSid}:{$authToken}");
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($smsPayloadData));
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201 || $httpCode === 200) {
        echo json_encode(["status" => "success", "message" => "Success! Your project contact details have been dispatched via text SMS alert."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Twilio gateway tracking server rejected authentication access tokens."]);
    }
    exit;
}

// End-route protection intercept catch
echo json_encode(["status" => "error", "message" => "Unknown communications channel request action."]);
exit;