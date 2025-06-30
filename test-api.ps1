# PowerShell script to test Hugging Face API integration
Write-Host "🧪 Testing Hugging Face Integration..." -ForegroundColor Blue

$testData = @{
    text = "Team A cannot play on Mondays"
}

$json = $testData | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/parse" -Method Post -Body $json -ContentType "application/json"
    
    Write-Host "✅ Parse successful!" -ForegroundColor Green
    Write-Host "   Method: $($response.parsingMethod)" -ForegroundColor Yellow
    Write-Host "   Confidence: $($response.data.confidence)" -ForegroundColor Yellow
    Write-Host "   Type: $($response.data.type)" -ForegroundColor Yellow
    Write-Host "   Entities: $($response.data.entities.Count)" -ForegroundColor Yellow
    
    if ($response.parsingMethod -eq "huggingface") {
        Write-Host "🎉 Hugging Face models are working!" -ForegroundColor Green
        if ($response.data.llmJudge) {
            Write-Host "   LLM Judge: $($response.data.llmJudge.isValid)" -ForegroundColor Cyan
            Write-Host "   Reasoning: $($response.data.llmJudge.reasoning)" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "⚠️ Using fallback rule-based parsing" -ForegroundColor Yellow
        Write-Host "   This means Hugging Face models are not working properly" -ForegroundColor Yellow
    }
    
    Write-Host "`nFull response:" -ForegroundColor Magenta
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
} 