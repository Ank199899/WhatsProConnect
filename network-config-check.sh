#!/bin/bash

# 🌐 Network Configuration Check Script
# WhatsApp Advanced - IP and Network Setup Verification

echo "🌐 Network Configuration Check for WhatsApp Advanced"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get network information
get_network_info() {
    echo -e "${BLUE}📊 Network Information:${NC}"
    echo "================================"
    
    # Get internal IP
    INTERNAL_IP=$(hostname -I | awk '{print $1}')
    echo -e "${BLUE}Internal IP:${NC} $INTERNAL_IP"
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "Unable to detect")
    echo -e "${BLUE}Public IP:${NC} $PUBLIC_IP"
    
    # Get default gateway
    GATEWAY=$(ip route | grep default | awk '{print $3}' | head -1)
    echo -e "${BLUE}Gateway:${NC} $GATEWAY"
    
    # Get network interface
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    echo -e "${BLUE}Interface:${NC} $INTERFACE"
    
    # Get subnet
    SUBNET=$(ip route | grep $INTERNAL_IP | grep -v default | awk '{print $1}' | head -1)
    echo -e "${BLUE}Subnet:${NC} $SUBNET"
    
    echo ""
}

# Function to check port accessibility
check_ports() {
    echo -e "${BLUE}🔌 Port Accessibility Check:${NC}"
    echo "================================"
    
    # Check if ports are listening
    PORTS=("3008" "3006" "5432" "80" "443")
    
    for port in "${PORTS[@]}"; do
        if netstat -tlnp 2>/dev/null | grep ":$port " > /dev/null; then
            echo -e "${GREEN}✅ Port $port: LISTENING${NC}"
        else
            echo -e "${RED}❌ Port $port: NOT LISTENING${NC}"
        fi
    done
    
    echo ""
}

# Function to check firewall status
check_firewall() {
    echo -e "${BLUE}🔥 Firewall Status:${NC}"
    echo "================================"
    
    # Check UFW status
    if command -v ufw >/dev/null 2>&1; then
        UFW_STATUS=$(sudo ufw status | head -1)
        echo -e "${BLUE}UFW Status:${NC} $UFW_STATUS"
        
        if [[ "$UFW_STATUS" == *"active"* ]]; then
            echo -e "${BLUE}UFW Rules:${NC}"
            sudo ufw status numbered | grep -E "(80|443|22|3008|3006)"
        fi
    else
        echo -e "${YELLOW}⚠️ UFW not installed${NC}"
    fi
    
    # Check iptables
    if command -v iptables >/dev/null 2>&1; then
        IPTABLES_RULES=$(sudo iptables -L INPUT | wc -l)
        echo -e "${BLUE}Iptables Rules:${NC} $IPTABLES_RULES"
    fi
    
    echo ""
}

# Function to check router/NAT configuration
check_nat_config() {
    echo -e "${BLUE}🏠 Router/NAT Configuration:${NC}"
    echo "================================"
    
    # Check if we're behind NAT
    if [[ "$INTERNAL_IP" == 192.168.* ]] || [[ "$INTERNAL_IP" == 10.* ]] || [[ "$INTERNAL_IP" == 172.* ]]; then
        echo -e "${YELLOW}⚠️ Server is behind NAT/Router${NC}"
        echo -e "${BLUE}Internal IP:${NC} $INTERNAL_IP"
        echo -e "${BLUE}Public IP:${NC} $PUBLIC_IP"
        echo ""
        echo -e "${YELLOW}📋 Required Router Configuration:${NC}"
        echo "1. Port Forwarding Rules needed:"
        echo "   - Port 80 → $INTERNAL_IP:80"
        echo "   - Port 443 → $INTERNAL_IP:443"
        echo "   - Port 3008 → $INTERNAL_IP:3008 (optional)"
        echo "   - Port 3006 → $INTERNAL_IP:3006 (optional)"
        echo ""
        echo "2. DMZ Configuration (alternative):"
        echo "   - Set $INTERNAL_IP as DMZ host"
        echo ""
    else
        echo -e "${GREEN}✅ Server has direct public IP${NC}"
    fi
    
    echo ""
}

# Function to test external connectivity
test_connectivity() {
    echo -e "${BLUE}🌐 External Connectivity Test:${NC}"
    echo "================================"
    
    # Test outbound connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Internet connectivity: OK${NC}"
    else
        echo -e "${RED}❌ Internet connectivity: FAILED${NC}"
    fi
    
    # Test DNS resolution
    if nslookup google.com >/dev/null 2>&1; then
        echo -e "${GREEN}✅ DNS resolution: OK${NC}"
    else
        echo -e "${RED}❌ DNS resolution: FAILED${NC}"
    fi
    
    # Test HTTP/HTTPS access to our server
    echo -e "${BLUE}Testing local server access:${NC}"
    
    # Test internal access
    if curl -s http://$INTERNAL_IP:3008 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Internal HTTP access: OK${NC}"
    else
        echo -e "${RED}❌ Internal HTTP access: FAILED${NC}"
    fi
    
    # Test public access (if different from internal)
    if [[ "$PUBLIC_IP" != "$INTERNAL_IP" ]] && [[ "$PUBLIC_IP" != "Unable to detect" ]]; then
        if curl -s http://$PUBLIC_IP:3008 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Public HTTP access: OK${NC}"
        else
            echo -e "${YELLOW}⚠️ Public HTTP access: FAILED (Port forwarding needed)${NC}"
        fi
    fi
    
    echo ""
}

# Function to generate configuration recommendations
generate_recommendations() {
    echo -e "${BLUE}💡 Configuration Recommendations:${NC}"
    echo "================================"
    
    # Check current setup
    if [[ "$INTERNAL_IP" == 192.168.* ]]; then
        echo -e "${YELLOW}📋 Router Configuration Required:${NC}"
        echo ""
        echo "1. Access your router admin panel (usually http://$GATEWAY)"
        echo "2. Navigate to Port Forwarding / Virtual Servers"
        echo "3. Add these rules:"
        echo ""
        echo "   Service Name: HTTP"
        echo "   External Port: 80"
        echo "   Internal IP: $INTERNAL_IP"
        echo "   Internal Port: 80"
        echo "   Protocol: TCP"
        echo ""
        echo "   Service Name: HTTPS"
        echo "   External Port: 443"
        echo "   Internal IP: $INTERNAL_IP"
        echo "   Internal Port: 443"
        echo "   Protocol: TCP"
        echo ""
        echo "4. Save and restart router"
        echo ""
    fi
    
    echo -e "${YELLOW}📋 DNS Configuration:${NC}"
    echo "Use PUBLIC IP for DNS records:"
    echo "Type: A, Name: @, Value: $PUBLIC_IP"
    echo "Type: A, Name: www, Value: $PUBLIC_IP"
    echo "Type: A, Name: api, Value: $PUBLIC_IP"
    echo ""
    
    echo -e "${YELLOW}📋 Nginx Configuration:${NC}"
    echo "Nginx should listen on: $INTERNAL_IP:80 and $INTERNAL_IP:443"
    echo "Proxy pass to: localhost:3008 and localhost:3006"
    echo ""
    
    echo -e "${YELLOW}📋 Application Configuration:${NC}"
    echo "Bind applications to: 0.0.0.0 (all interfaces)"
    echo "Frontend: 0.0.0.0:3008"
    echo "Backend: 0.0.0.0:3006"
    echo ""
}

# Function to create router configuration guide
create_router_guide() {
    echo -e "${BLUE}📝 Creating router configuration guide...${NC}"
    
    cat > router-port-forwarding-guide.md << EOF
# 🏠 Router Port Forwarding Guide
## WhatsApp Advanced - Network Configuration

### **Current Network Setup**
- **Internal IP**: $INTERNAL_IP
- **Public IP**: $PUBLIC_IP
- **Gateway**: $GATEWAY
- **Interface**: $INTERFACE

### **Required Port Forwarding Rules**

#### **Rule 1: HTTP Traffic**
- **Service Name**: WhatsApp-HTTP
- **External Port**: 80
- **Internal IP**: $INTERNAL_IP
- **Internal Port**: 80
- **Protocol**: TCP
- **Status**: Enabled

#### **Rule 2: HTTPS Traffic**
- **Service Name**: WhatsApp-HTTPS
- **External Port**: 443
- **Internal IP**: $INTERNAL_IP
- **Internal Port**: 443
- **Protocol**: TCP
- **Status**: Enabled

#### **Rule 3: Frontend Direct Access (Optional)**
- **Service Name**: WhatsApp-Frontend
- **External Port**: 3008
- **Internal IP**: $INTERNAL_IP
- **Internal Port**: 3008
- **Protocol**: TCP
- **Status**: Enabled

#### **Rule 4: Backend Direct Access (Optional)**
- **Service Name**: WhatsApp-Backend
- **External Port**: 3006
- **Internal IP**: $INTERNAL_IP
- **Internal Port**: 3006
- **Protocol**: TCP
- **Status**: Enabled

### **Router Access Instructions**

1. **Access Router Admin Panel**
   - Open browser and go to: http://$GATEWAY
   - Login with admin credentials

2. **Navigate to Port Forwarding**
   - Look for: "Port Forwarding", "Virtual Servers", "NAT", or "Gaming"
   - Different routers have different menu names

3. **Add Port Forwarding Rules**
   - Add each rule from the table above
   - Make sure to enable each rule

4. **Save and Restart**
   - Save configuration
   - Restart router if required

### **Common Router Interfaces**

#### **TP-Link**
- Advanced → NAT Forwarding → Virtual Servers

#### **Netgear**
- Dynamic DNS → Port Forwarding / Port Triggering

#### **Linksys**
- Smart Wi-Fi Tools → Port Forwarding

#### **ASUS**
- Adaptive QoS → Traditional QoS → Port Forwarding

#### **D-Link**
- Advanced → Port Forwarding

### **Alternative: DMZ Configuration**

If port forwarding is complex, you can set up DMZ:

1. Navigate to DMZ settings in router
2. Enable DMZ
3. Set DMZ Host IP to: $INTERNAL_IP
4. Save configuration

**⚠️ Warning**: DMZ exposes all ports, less secure than specific port forwarding.

### **Testing Port Forwarding**

After configuration, test with:

```bash
# Test from external network
curl -I http://$PUBLIC_IP
curl -I https://$PUBLIC_IP

# Online port checker
# https://www.yougetsignal.com/tools/open-ports/
# Check ports 80 and 443 for IP: $PUBLIC_IP
```

### **Troubleshooting**

#### **Port Forwarding Not Working**
1. Check if router supports UPnP (disable if enabled)
2. Verify internal IP hasn't changed (use static IP)
3. Check router firewall settings
4. Restart router after configuration
5. Contact ISP if still not working (some ISPs block ports)

#### **Static IP Configuration**
Set static IP for server:
```bash
# Edit netplan configuration
sudo nano /etc/netplan/01-netcfg.yaml

# Add static configuration:
network:
  version: 2
  ethernets:
    $INTERFACE:
      dhcp4: false
      addresses: [$INTERNAL_IP/24]
      gateway4: $GATEWAY
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

# Apply configuration
sudo netplan apply
```
EOF

    echo -e "${GREEN}✅ Router configuration guide created: router-port-forwarding-guide.md${NC}"
}

# Function to update scripts with correct IPs
update_scripts_for_network() {
    echo -e "${BLUE}🔧 Updating scripts for your network configuration...${NC}"
    
    # Update domain setup guide
    if [ -f "DOMAIN-SETUP-GUIDE.md" ]; then
        sed -i "s/100\.115\.3\.36/$PUBLIC_IP/g" DOMAIN-SETUP-GUIDE.md
        echo -e "${GREEN}✅ Updated DOMAIN-SETUP-GUIDE.md${NC}"
    fi
    
    # Update nginx config template
    if [ -f "nginx-domain-config.conf" ]; then
        # Add comment about internal IP
        sed -i "1i# Internal IP: $INTERNAL_IP" nginx-domain-config.conf
        sed -i "2i# Public IP: $PUBLIC_IP" nginx-domain-config.conf
        echo -e "${GREEN}✅ Updated nginx-domain-config.conf${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting network configuration check...${NC}"
    echo ""
    
    get_network_info
    check_ports
    check_firewall
    check_nat_config
    test_connectivity
    generate_recommendations
    create_router_guide
    update_scripts_for_network
    
    echo -e "${GREEN}🎉 Network configuration check completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "- Internal IP: $INTERNAL_IP"
    echo "- Public IP: $PUBLIC_IP"
    echo "- Router guide created: router-port-forwarding-guide.md"
    echo ""
    echo -e "${YELLOW}⚠️ Next Steps:${NC}"
    echo "1. Configure port forwarding in your router"
    echo "2. Use PUBLIC IP ($PUBLIC_IP) for DNS records"
    echo "3. Test external access after router configuration"
    echo "4. Run domain setup scripts with your domain"
}

# Run main function
main "$@"
