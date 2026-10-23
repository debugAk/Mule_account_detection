from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import TransactionModel, AccountModel, AlertModel

class GraphService:
    @staticmethod
    def get_network_graph(
        db: Session,
        focus_account: Optional[str] = None,
        min_amount: float = 0.0,
        limit_edges: int = 100,
    ) -> Dict[str, Any]:
        query = db.query(TransactionModel)

        if min_amount > 0:
            query = query.filter(TransactionModel.amount >= min_amount)

        if focus_account:
            # Get 1-hop transactions involving the account
            query = query.filter(
                (TransactionModel.source_account == focus_account) |
                (TransactionModel.destination_account == focus_account)
            )

        transactions = query.order_by(TransactionModel.timestamp.desc()).limit(limit_edges).all()

        nodes_dict: Dict[str, Dict[str, Any]] = {}
        edges_list: List[Dict[str, Any]] = []

        # Track degrees
        in_degree: Dict[str, int] = {}
        out_degree: Dict[str, int] = {}

        # Aggregate parallel edges between identical source and destination
        aggregated_edges: Dict[tuple, Dict[str, Any]] = {}

        for tx in transactions:
            src = tx.source_account
            dest = tx.destination_account

            out_degree[src] = out_degree.get(src, 0) + 1
            in_degree[dest] = in_degree.get(dest, 0) + 1

            pair_key = (src, dest)
            if pair_key not in aggregated_edges:
                aggregated_edges[pair_key] = {
                    "id": f"E-{src}-{dest}",
                    "source": src,
                    "target": dest,
                    "amountINR": tx.amount,
                    "txnCount": 1,
                    "channel": tx.channel,
                    "sampleTxnId": tx.id,
                    "isObserved": True,
                    "inferred": False,
                }
            else:
                aggregated_edges[pair_key]["amountINR"] += tx.amount
                aggregated_edges[pair_key]["txnCount"] += 1

        # Fetch account metadata for nodes
        all_account_ids = list(set(list(in_degree.keys()) + list(out_degree.keys())))
        accounts_map = {
            a.id: a for a in db.query(AccountModel).filter(AccountModel.id.in_(all_account_ids)).all()
        }

        # Build node objects
        for acc_id in all_account_ids:
            acc = accounts_map.get(acc_id)
            total_deg = in_degree.get(acc_id, 0) + out_degree.get(acc_id, 0)

            node_type = "beneficiary" if acc_id.startswith("BEN-") else "account"
            risk_score = acc.risk_score if acc else (85 if node_type == "beneficiary" else 50)
            subtext = f"{acc.bank_name if acc else 'Counterparty'} · {total_deg} edges"

            nodes_dict[acc_id] = {
                "data": {
                    "id": acc_id,
                    "label": acc_id,
                    "type": node_type,
                    "riskScore": risk_score,
                    "subtext": subtext,
                    "degree": total_deg,
                    "inDegree": in_degree.get(acc_id, 0),
                    "outDegree": out_degree.get(acc_id, 0),
                }
            }

        # Add formatted edges
        for key, edge_data in aggregated_edges.items():
            amt = edge_data["amountINR"]
            amt_formatted = f"₹{amt:,.0f}" if amt < 100000 else f"₹{amt/100000:.2f}L" if amt < 10000000 else f"₹{amt/10000000:.2f}Cr"
            edges_list.append({
                "data": {
                    **edge_data,
                    "label": f"{amt_formatted} ({edge_data['txnCount']} txs)",
                }
            })

        # Calculate high-degree accounts
        sorted_degrees = sorted(
            [{"account": k, "degree": v["data"]["degree"], "riskScore": v["data"]["riskScore"]} for k, v in nodes_dict.items()],
            key=lambda x: x["degree"],
            reverse=True,
        )

        return {
            "nodes": list(nodes_dict.values()),
            "edges": edges_list,
            "total_nodes": len(nodes_dict),
            "total_edges": len(edges_list),
            "high_degree_accounts": sorted_degrees[:5],
            "money_path_hops": [e["data"]["id"] for e in edges_list[:6]],
        }

graph_service = GraphService()
