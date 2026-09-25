import React, { useState } from 'react';
import './Refund.css';

const Refund = () => {
    const [isOpen, setIsOpen] = useState(false);

    const policyData = [
        {
            category: "Lifestyle Items",
            items: [
                {
                    type: "Jewellery, Sari, Dress, Women's Top, etc.",
                    window: "3 days",
                    action: "Replacement Only"
                },
                {
                    type: "Footwear, Watch, Winter Wear",
                    window: "3 days",
                    action: "Refund, Replacement or Exchange"
                }
            ]
        },
        {
            category: "Electronics",
            items: [
                {
                    type: "Trimmer, Mobile Phones (except Apple & Google)",
                    window: "7 days",
                    action: "Replacement only"
                }
            ]
        },
        {
            category: "Home & Living",
            items: [
                {
                    type: "Home Improvement Tools, Household Items",
                    window: "3 days",
                    action: "Refund or replacement"
                }
            ]
        }
    ];

    return (
        <div className={`refund-policy ${isOpen ? 'open' : ''}`}>
            <div className="refund-header" onClick={() => setIsOpen(!isOpen)}>
                <h2>Refund Policy</h2>
                <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
            </div>
            
            <div className="refund-content">
                <div className="policy-intro">
                    <p>Returns is a scheme provided by respective sellers directly under this policy in terms of which the option of exchange, replacement and/ or refund is offered by the respective sellers to you.</p>
                    
                    <div className="important-note">
                        <h3>Important Notes:</h3>
                        <ul>
                            <li>Items sold up to ₹200/- are not eligible for returns/exchange</li>
                            <li>For products priced above ₹200/-, a return fee of ₹40/- is applicable</li>
                            <li>Replacement and exchange are provided free of cost</li>
                        </ul>
                    </div>
                </div>

                <div className="policy-categories">
                    {policyData.map((category, index) => (
                        <div key={index} className="category-section">
                            <h3>{category.category}</h3>
                            <div className="items-grid">
                                {category.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="policy-item">
                                        <div className="item-type">{item.type}</div>
                                        <div className="item-details">
                                            <span className="window">{item.window}</span>
                                            <span className="action">{item.action}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cancellation-policy">
                    <h3>Cancellation Policy</h3>
                    <p>Cancellations are not allowed for certain products post 24 hours from the time the order is placed by the customer until the delivery of the product by the delivery agent. Customers can cancel the product while being delivered by the delivery agent or refuse to accept the product at the time of delivery.</p>
                </div>

                <div className="special-cases">
                    <h3>Special Cases</h3>
                    <ul>
                        <li>Non-returnable items: Wind Instruments (due to hygiene and personal wellness)</li>
                        <li>Electronics: May require troubleshooting before replacement</li>
                        <li>Only one replacement shall be provided per order</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Refund;
